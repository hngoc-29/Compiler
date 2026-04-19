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
async function compileAndRunStream(code, input, timeoutMs, optimize, callbacks) {
  const id      = randomUUID();
  const tmpDir  = os.tmpdir();
  const srcFile = join(tmpDir, `cppeditor_${id}.cpp`);
  const binFile = join(tmpDir, `cppeditor_${id}.out`);

  const optFlag = optimize ? '-O2' : '-O0';
  const gppArgs = [
    '-std=c++20', optFlag, '-pipe',
    '-Wall', '-Wextra',
    '-o', binFile, srcFile,
  ];

  try {
    await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });

    callbacks.onStatus?.('compiling');
    const compileRes = await runProcess('g++', gppArgs, '', COMPILE_TIMEOUT);

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

      const { code, input = '', optimize = false } = data ?? {};

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
  });

  // ── Start ──────────────────────────────────────────────────────────────────
  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
