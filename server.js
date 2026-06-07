/**
 * server.js – Custom Next.js server + Socket.IO streaming compiler
 *
 * Chạy: node server.js (cả dev lẫn production)
 * Trong Docker standalone: Dockerfile copy file này đè lên .next/standalone/server.js
 */
'use strict';

const { createServer } = require('http');
const { parse }        = require('url');
const next             = require('next');
const { Server }       = require('socket.io');
const { spawn }        = require('child_process');
const { writeFile, unlink } = require('fs/promises');
const { join }         = require('path');
const { randomUUID }   = require('crypto');
const os               = require('os');

const dev      = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port     = parseInt(process.env.PORT || '3000', 10);

const app    = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;  // 2 MB
const COMPILE_TIMEOUT  = 30_000;            // 30 s
const RUN_TIMEOUT      = 10_000;            // 10 s

// ─── Language map (mirrors lib/languages.ts) ──────────────────────────────────
const LANG_MAP = {
  cpp20:   { ext: 'cpp', compiler: 'g++',     stdFlag: '-std=c++20', extraLibs: [] },
  cpp17:   { ext: 'cpp', compiler: 'g++',     stdFlag: '-std=c++17', extraLibs: [] },
  cpp14:   { ext: 'cpp', compiler: 'g++',     stdFlag: '-std=c++14', extraLibs: [] },
  cpp11:   { ext: 'cpp', compiler: 'g++',     stdFlag: '-std=c++11', extraLibs: [] },
  c11:     { ext: 'c',   compiler: 'gcc',     stdFlag: '-std=c11',   extraLibs: ['-lm'] },
  python3: { ext: 'py',  compiler: 'python3', stdFlag: null,         extraLibs: [] },
};

// ─── Process runner (with optional streaming callbacks) ───────────────────────
function runProcess(cmd, args, stdinData, timeoutMs, onStdout, onStderr) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { shell: false });
    let stdout = '', stderr = '', timedOut = false, settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
      setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} }, 1000);
    }, timeoutMs);

    if (stdinData) {
      proc.stdin.write(stdinData, 'utf-8', () => proc.stdin.end());
    } else {
      proc.stdin.end();
    }

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString('utf-8');
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += text;
        onStdout?.(text);
      }
    });
    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString('utf-8');
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += text;
        onStderr?.(text);
      }
    });

    const finish = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? -1, timedOut });
    };

    proc.on('close', finish);
    proc.on('error', (err) => { stderr += `\nProcess error: ${err.message}`; finish(-1); });
  });
}

// ─── Compile + run with streaming ─────────────────────────────────────────────
async function compileAndRunStream(code, input, timeoutMs, optimize, langId, callbacks) {
  const lang    = LANG_MAP[langId] ?? LANG_MAP['cpp20'];
  const id      = randomUUID();
  const tmpDir  = os.tmpdir();
  const srcFile = join(tmpDir, `cppeditor_${id}.${lang.ext}`);
  const binFile = join(tmpDir, `cppeditor_${id}.out`);

  try {
    await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });

    // ── Python: no compile step ───────────────────────────────────────────
    if (lang.compiler === 'python3') {
      callbacks.onStatus?.('running');
      const t0     = Date.now();
      const runRes = await runProcess(
        'python3', [srcFile], input, timeoutMs,
        callbacks.onStdout,
        callbacks.onStderr,
      );
      const runtime = Date.now() - t0;
      const isRuntimeError = runRes.exitCode !== 0 && !runRes.timedOut;
      callbacks.onDone?.({
        stdout:       runRes.stdout,
        stderr:       isRuntimeError ? '' : runRes.stderr,
        compileError: isRuntimeError ? (runRes.stderr || 'Runtime error') : null,
        exitCode:     runRes.exitCode,
        runtime,
        timedOut:     runRes.timedOut,
      });
      return;
    }

    // ── C / C++: compile then run ─────────────────────────────────────────
    const optFlag  = optimize ? '-O2' : '-O0';
    const compArgs = [
      lang.stdFlag, optFlag, '-pipe',
      '-Wall', '-Wextra',
      ...lang.extraLibs,
      '-o', binFile, srcFile,
    ];

    callbacks.onStatus?.('compiling');
    const compileRes = await runProcess(lang.compiler, compArgs, '', COMPILE_TIMEOUT);

    if (compileRes.exitCode !== 0) {
      callbacks.onDone?.({
        stdout: '', stderr: '',
        compileError: compileRes.stderr || 'Compilation failed',
        exitCode: compileRes.exitCode,
        runtime: 0, timedOut: false,
      });
      return;
    }

    callbacks.onStatus?.('running');
    const t0     = Date.now();
    const runRes = await runProcess(
      binFile, [], input, timeoutMs,
      callbacks.onStdout,
      callbacks.onStderr,
    );
    const runtime = Date.now() - t0;

    callbacks.onDone?.({
      stdout:       runRes.stdout,
      stderr:       runRes.stderr,
      compileError: null,
      exitCode:     runRes.exitCode,
      runtime,
      timedOut:     runRes.timedOut,
    });
  } finally {
    await Promise.allSettled([
      unlink(srcFile).catch(() => {}),
      unlink(binFile).catch(() => {}),
    ]);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // ── Socket.IO ──────────────────────────────────────────────────────────────
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: { origin: '*' },
    // Tránh conflict với Next.js long-polling bằng cách chỉ dùng websocket
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    let isCompiling = false;

    socket.on('compile', async (data) => {
      if (isCompiling) {
        socket.emit('compile:error', { message: 'Đang compile rồi, chờ tí!' });
        return;
      }

      const { code, input = '', optimize = false, langId = 'cpp20' } = data ?? {};

      if (typeof code !== 'string' || !code.trim()) {
        socket.emit('compile:error', { message: 'Code không hợp lệ' });
        return;
      }

      if (Buffer.byteLength(code, 'utf-8') > 100 * 1024) {
        socket.emit('compile:error', { message: 'Code quá lớn (tối đa 100KB)' });
        return;
      }

      isCompiling = true;

      try {
        await compileAndRunStream(
          code,
          typeof input === 'string' ? input : '',
          RUN_TIMEOUT,
          optimize === true,
          typeof langId === 'string' && langId in LANG_MAP ? langId : 'cpp20',
          {
            onStatus:  (s)     => socket.emit('compile:status',  s),
            onStdout:  (chunk) => socket.emit('compile:stdout',  chunk),
            onStderr:  (chunk) => socket.emit('compile:stderr',  chunk),
            onDone:    (result)=> socket.emit('compile:done',    result),
          },
        );
      } catch (err) {
        socket.emit('compile:error', { message: String(err) });
      } finally {
        isCompiling = false;
      }
    });

    // ── compile:batch — compile ONCE, run with each input, stream results ───────
    // Protocol:
    //   client → compile:batch  { code, inputs: string[], optimize, langId }
    //   server → compile:batch:status  'compiling' | 'running'
    //   server → compile:batch:error   { stderr }          (compile failed → stop)
    //   server → compile:batch:result  { index, stdout, stderr, exitCode, runtime, timedOut }
    //   server → compile:batch:done    { total }
    socket.on('compile:batch', async (data) => {
      if (isCompiling) {
        socket.emit('compile:error', { message: 'Đang compile rồi, chờ tí!' });
        return;
      }

      const { code, inputs = [''], optimize = false, langId = 'cpp20' } = data ?? {};

      if (typeof code !== 'string' || !code.trim()) {
        socket.emit('compile:error', { message: 'Code không hợp lệ' });
        return;
      }
      if (!Array.isArray(inputs) || inputs.length === 0) {
        socket.emit('compile:error', { message: 'inputs phải là mảng không rỗng' });
        return;
      }
      if (Buffer.byteLength(code, 'utf-8') > 100 * 1024) {
        socket.emit('compile:error', { message: 'Code quá lớn (tối đa 100KB)' });
        return;
      }

      isCompiling = true;

      const resolvedLangId = typeof langId === 'string' && langId in LANG_MAP ? langId : 'cpp20';
      const lang    = LANG_MAP[resolvedLangId];
      const id      = randomUUID();
      const tmpDir  = os.tmpdir();
      const srcFile = join(tmpDir, `cppeditor_${id}.${lang.ext}`);
      const binFile = join(tmpDir, `cppeditor_${id}.out`);

      try {
        await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });

        // ── Python: không có bước compile, chạy thẳng N lần ─────────────────
        if (lang.compiler === 'python3') {
          socket.emit('compile:batch:status', 'running');

          for (let i = 0; i < inputs.length; i++) {
            const input = typeof inputs[i] === 'string' ? inputs[i] : '';
            const t0    = Date.now();
            const res   = await runProcess('python3', [srcFile], input, RUN_TIMEOUT);
            const isRuntimeError = res.exitCode !== 0 && !res.timedOut;
            socket.emit('compile:batch:result', {
              index:    i,
              stdout:   res.stdout,
              stderr:   isRuntimeError ? '' : res.stderr,
              exitCode: res.exitCode,
              runtime:  Date.now() - t0,
              timedOut: res.timedOut,
            });
          }

          socket.emit('compile:batch:done', { total: inputs.length });
          return;
        }

        // ── C / C++: compile 1 lần ───────────────────────────────────────────
        const optFlag  = optimize ? '-O2' : '-O0';
        const compArgs = [
          lang.stdFlag, optFlag, '-pipe', '-Wall', '-Wextra',
          ...lang.extraLibs,
          '-o', binFile, srcFile,
        ];

        socket.emit('compile:batch:status', 'compiling');
        const compileRes = await runProcess(lang.compiler, compArgs, '', COMPILE_TIMEOUT);

        if (compileRes.exitCode !== 0) {
          socket.emit('compile:batch:error', {
            stderr:   compileRes.stderr || 'Compilation failed',
            exitCode: compileRes.exitCode,
          });
          return;
        }

        // ── Chạy N lần với từng input ────────────────────────────────────────
        socket.emit('compile:batch:status', 'running');

        for (let i = 0; i < inputs.length; i++) {
          const input = typeof inputs[i] === 'string' ? inputs[i] : '';
          const t0    = Date.now();
          const res   = await runProcess(binFile, [], input, RUN_TIMEOUT);
          socket.emit('compile:batch:result', {
            index:    i,
            stdout:   res.stdout,
            stderr:   res.stderr,
            exitCode: res.exitCode,
            runtime:  Date.now() - t0,
            timedOut: res.timedOut,
          });
        }

        socket.emit('compile:batch:done', { total: inputs.length });

      } catch (err) {
        socket.emit('compile:error', { message: String(err) });
      } finally {
        isCompiling = false;
        await Promise.allSettled([
          unlink(srcFile).catch(() => {}),
          unlink(binFile).catch(() => {}),
        ]);
      }
    });
  });

  // ── Start ──────────────────────────────────────────────────────────────────
  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
