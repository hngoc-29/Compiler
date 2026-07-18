/**
 * server.js – Custom Next.js server + Socket.IO streaming compiler
 *
 * Chạy: node server.js (cả dev lẫn production)
 * Trong Docker standalone: Dockerfile copy file này đè lên .next/standalone/server.js
 */
'use strict';

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const { writeFile, unlink } = require('fs/promises');
const { join } = require('path');
const { randomUUID } = require('crypto');
const os = require('os');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;  // 2 MB
const COMPILE_TIMEOUT = 30_000;            // 30 s
const RUN_TIMEOUT = 10_000;            // 10 s
const REALTIME_FLUSH_MS = 80;          // how often "realtime mode" bursts stdout to the client

// ─── Throttled emitter ──────────────────────────────────────────────────────
// A tight, no-newline output loop (e.g. `for(...) cout << i;`) can hand us
// tens of thousands of `data` events per second once the OS-level buffering
// is disabled (see the stdbuf/-u usage below). Emitting a socket message for
// every single one of those would flood both the socket and the browser's
// render loop — paradoxically making the UI feel MORE frozen, not more
// real-time. This coalesces everything received within a short window into
// one burst, which still reads as "streaming live" to a human (~12
// updates/sec) without the flood. flushNow() drains whatever's pending
// immediately — used right before a run reports done, so the very last bit
// of output isn't stuck waiting out the interval.
function makeThrottledEmitter(emit, intervalMs = REALTIME_FLUSH_MS) {
  let buf = '';
  let timer = null;
  const flush = () => {
    timer = null;
    if (buf) { const b = buf; buf = ''; emit(b); }
  };
  return {
    push(chunk) {
      buf += chunk;
      if (!timer) timer = setTimeout(flush, intervalMs);
    },
    flushNow() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (buf) { const b = buf; buf = ''; emit(b); }
    },
  };
}

// ─── Language map (mirrors lib/languages.ts) ──────────────────────────────────
const LANG_MAP = {
  cpp20: { ext: 'cpp', compiler: 'g++', stdFlag: '-std=c++20', extraLibs: [] },
  cpp17: { ext: 'cpp', compiler: 'g++', stdFlag: '-std=c++17', extraLibs: [] },
  cpp14: { ext: 'cpp', compiler: 'g++', stdFlag: '-std=c++14', extraLibs: [] },
  cpp11: { ext: 'cpp', compiler: 'g++', stdFlag: '-std=c++11', extraLibs: [] },
  c11: { ext: 'c', compiler: 'gcc', stdFlag: '-std=c11', extraLibs: ['-lm'] },
  python3: { ext: 'py', compiler: 'python3', stdFlag: null, extraLibs: [] },
};

// ─── Process runner (with optional streaming callbacks) ───────────────────────
// Returns a Promise<result> AND exposes proc via callbacks.onProcess for interactive stdin.
function runProcess(cmd, args, stdinData, timeoutMs, onStdout, onStderr, onProcess, interactive = false) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { shell: false });
    let stdout = '', stderr = '', timedOut = false, settled = false;

    // Expose the process handle so callers can pipe interactive stdin
    onProcess?.(proc);

    const timer = setTimeout(() => {
      timedOut = true;
      try { proc.stdin.end(); } catch { }
      proc.kill('SIGTERM');
      setTimeout(() => { try { proc.kill('SIGKILL'); } catch { } }, 1000);
    }, timeoutMs);

    if (stdinData) {
      proc.stdin.write(stdinData, 'utf-8');
    }
    // If interactive is false, end stdin immediately so the process doesn't hang waiting for input.
    if (!interactive) {
      proc.stdin.end();
    }

    // BUG FOUND VIA TESTING: once accumulated output crosses MAX_OUTPUT_BYTES,
    // this used to just silently stop calling onStdout/onStderr — a long/
    // infinite loop (exactly the "watch it run in real time" use case) hits
    // this within well under a second once output is unbuffered, and the
    // stream would just go quiet with zero indication why. Emit one visible
    // notice at the moment the cap is hit so the person knows logging didn't
    // freeze — it's an intentional cutoff.
    let stdoutCapped = false, stderrCapped = false;
    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString('utf-8');
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += text;
        onStdout?.(text);
        if (stdout.length >= MAX_OUTPUT_BYTES && !stdoutCapped) {
          stdoutCapped = true;
          onStdout?.('\n⚠️ [output truncated — đã vượt quá 2MB, log tiếp theo sẽ không hiển thị]\n');
        }
      }
    });
    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString('utf-8');
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += text;
        onStderr?.(text);
        if (stderr.length >= MAX_OUTPUT_BYTES && !stderrCapped) {
          stderrCapped = true;
          onStderr?.('\n⚠️ [stderr truncated — đã vượt quá 2MB]\n');
        }
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
// `realtime` (default true = the new default mode): forces the running
// program's stdout/stderr to be OS-level unbuffered, via `stdbuf -o0 -e0` for
// native C/C++ binaries and `python3 -u` for Python. Without this, glibc/
// CPython fully-buffer stdout whenever it isn't a real terminal (which a
// spawned pipe never is) — a tight loop with no newline (e.g. `cout << i;`)
// would sit in a several-KB buffer and only surface once it filled or the
// process exited/got killed, which is exactly why output looked like it
// arrived "as one lump at the end" instead of live. Passing `realtime: false`
// keeps the old, unwrapped behavior available.
async function compileAndRunStream(code, input, timeoutMs, optimize, langId, callbacks, interactive = false, realtime = true) {
  const lang = LANG_MAP[langId] ?? LANG_MAP['cpp20'];
  const id = randomUUID();
  const tmpDir = os.tmpdir();
  const srcFile = join(tmpDir, `cppeditor_${id}.${lang.ext}`);
  const binFile = join(tmpDir, `cppeditor_${id}.out`);

  try {
    await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });

    // ── Python: no compile step ───────────────────────────────────────────
    if (lang.compiler === 'python3') {
      callbacks.onStatus?.('running');
      const t0 = Date.now();
      const pyArgs = realtime ? ['-u', srcFile] : [srcFile];
      const runRes = await runProcess(
        'python3', pyArgs, input, timeoutMs,
        callbacks.onStdout,
        callbacks.onStderr,
        callbacks.onProcess, interactive);
      const runtime = Date.now() - t0;
      const isRuntimeError = runRes.exitCode !== 0 && !runRes.timedOut;
      callbacks.onDone?.({
        stdout: runRes.stdout,
        stderr: isRuntimeError ? '' : runRes.stderr,
        compileError: isRuntimeError ? (runRes.stderr || 'Runtime error') : null,
        exitCode: runRes.exitCode,
        runtime,
        timedOut: runRes.timedOut,
      });
      return;
    }

    // ── C / C++: compile then run ─────────────────────────────────────────
    const optFlag = optimize ? '-O2' : '-O0';
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
    const t0 = Date.now();
    // stdbuf reconfigures the child's C stdio buffering mode before it even
    // starts — '-o0'/'-e0' means fully unbuffered, so every write() the
    // program makes (even a single `cout << i` with no newline) reaches our
    // pipe immediately instead of sitting in a several-KB libc buffer.
    const runCmd = realtime ? 'stdbuf' : binFile;
    const runArgs = realtime ? ['-o0', '-e0', binFile] : [];
    const runRes = await runProcess(
      runCmd, runArgs, input, timeoutMs,
      callbacks.onStdout,
      callbacks.onStderr,
      callbacks.onProcess, interactive);
    const runtime = Date.now() - t0;

    callbacks.onDone?.({
      stdout: runRes.stdout,
      stderr: runRes.stderr,
      compileError: null,
      exitCode: runRes.exitCode,
      runtime,
      timedOut: runRes.timedOut,
    });
  } finally {
    await Promise.allSettled([
      unlink(srcFile).catch(() => { }),
      unlink(binFile).catch(() => { }),
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
    // Reference to the currently running child process (for interactive stdin)
    let activeProc = null;

    // ── Interactive stdin: client sends data to the running process ──────────
    socket.on('compile:stdin', (data) => {
      if (activeProc && activeProc.stdin && !activeProc.stdin.destroyed) {
        try {
          activeProc.stdin.write(typeof data === 'string' ? data : String(data), 'utf-8');
        } catch { /* process may have exited */ }
      }
    });

    // ── End stdin: client signals no more input ─────────────────────────────
    socket.on('compile:stdin:end', () => {
      if (activeProc && activeProc.stdin && !activeProc.stdin.destroyed) {
        try { activeProc.stdin.end(); } catch { }
      }
    });

    socket.on('compile', async (data) => {
      if (isCompiling) {
        socket.emit('compile:error', { message: 'Đang compile rồi, chờ tí!' });
        return;
      }

      const { code, input = '', optimize = false, langId = 'cpp20', interactive = false, realtime = true } = data ?? {};

      if (typeof code !== 'string' || !code.trim()) {
        socket.emit('compile:error', { message: 'Code không hợp lệ' });
        return;
      }

      if (Buffer.byteLength(code, 'utf-8') > 100 * 1024) {
        socket.emit('compile:error', { message: 'Code quá lớn (tối đa 100KB)' });
        return;
      }

      isCompiling = true;
      activeProc = null;

      // In realtime mode, coalesce rapid stdout/stderr into small throttled
      // bursts (see makeThrottledEmitter) instead of one socket message per
      // OS-level write — otherwise a tight unbuffered loop can emit tens of
      // thousands of messages/sec and paradoxically make the UI feel frozen.
      const stdoutEmitter = realtime === true
        ? makeThrottledEmitter((chunk) => socket.emit('compile:stdout', chunk))
        : { push: (chunk) => socket.emit('compile:stdout', chunk), flushNow: () => {} };
      const stderrEmitter = realtime === true
        ? makeThrottledEmitter((chunk) => socket.emit('compile:stderr', chunk))
        : { push: (chunk) => socket.emit('compile:stderr', chunk), flushNow: () => {} };

      try {
        // BUG FIX: this cap used to be a flat 60s regardless of `interactive`,
        // which silently clamped the client's longer interactive timeout
        // (120s) back down — so a run waiting on user input could still get
        // killed well before the person finished typing. Interactive runs now
        // get a higher ceiling; non-interactive (unattended) runs keep the
        // tighter 60s cap since nothing is waiting on a human there.
        const cap = interactive ? 180_000 : 60_000;
        const timeoutMs = typeof data.timeoutMs === 'number' && data.timeoutMs > 0
          ? Math.min(data.timeoutMs, cap) : (interactive ? 120_000 : RUN_TIMEOUT);

        await compileAndRunStream(
          code,
          // In interactive mode, don't pre-fill stdin — user will send it live
          interactive ? '' : (typeof input === 'string' ? input : ''),
          timeoutMs,
          optimize === true,
          typeof langId === 'string' && langId in LANG_MAP ? langId : 'cpp20',
          {
            onStatus: (s) => socket.emit('compile:status', s),
            onStdout: (chunk) => stdoutEmitter.push(chunk),
            onStderr: (chunk) => stderrEmitter.push(chunk),
            onDone: (result) => {
              // Flush any output still sitting in the throttle buffer BEFORE
              // telling the client the run is done, so nothing gets dropped
              // or arrives out of order after the "done" signal.
              stdoutEmitter.flushNow();
              stderrEmitter.flushNow();
              activeProc = null;
              socket.emit('compile:done', result);
            },
            onProcess: (proc) => { activeProc = proc; },
          }, interactive, realtime === true);
      } catch (err) {
        activeProc = null;
        socket.emit('compile:error', { message: String(err) });
      } finally {
        isCompiling = false;
        activeProc = null;
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
      const lang = LANG_MAP[resolvedLangId];
      const id = randomUUID();
      const tmpDir = os.tmpdir();
      const srcFile = join(tmpDir, `cppeditor_${id}.${lang.ext}`);
      const binFile = join(tmpDir, `cppeditor_${id}.out`);

      try {
        await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });

        // ── Python: không có bước compile, chạy thẳng N lần ─────────────────
        if (lang.compiler === 'python3') {
          socket.emit('compile:batch:status', 'running');

          for (let i = 0; i < inputs.length; i++) {
            const input = typeof inputs[i] === 'string' ? inputs[i] : '';
            const t0 = Date.now();
            const res = await runProcess('python3', [srcFile], input, RUN_TIMEOUT);
            const isRuntimeError = res.exitCode !== 0 && !res.timedOut;
            socket.emit('compile:batch:result', {
              index: i,
              stdout: res.stdout,
              stderr: isRuntimeError ? '' : res.stderr,
              exitCode: res.exitCode,
              runtime: Date.now() - t0,
              timedOut: res.timedOut,
            });
          }

          socket.emit('compile:batch:done', { total: inputs.length });
          return;
        }

        // ── C / C++: compile 1 lần ───────────────────────────────────────────
        const optFlag = optimize ? '-O2' : '-O0';
        const compArgs = [
          lang.stdFlag, optFlag, '-pipe', '-Wall', '-Wextra',
          ...lang.extraLibs,
          '-o', binFile, srcFile,
        ];

        socket.emit('compile:batch:status', 'compiling');
        const compileRes = await runProcess(lang.compiler, compArgs, '', COMPILE_TIMEOUT);

        if (compileRes.exitCode !== 0) {
          socket.emit('compile:batch:error', {
            stderr: compileRes.stderr || 'Compilation failed',
            exitCode: compileRes.exitCode,
          });
          return;
        }

        // ── Chạy N lần với từng input ────────────────────────────────────────
        socket.emit('compile:batch:status', 'running');

        for (let i = 0; i < inputs.length; i++) {
          const input = typeof inputs[i] === 'string' ? inputs[i] : '';
          const t0 = Date.now();
          const res = await runProcess(binFile, [], input, RUN_TIMEOUT);
          socket.emit('compile:batch:result', {
            index: i,
            stdout: res.stdout,
            stderr: res.stderr,
            exitCode: res.exitCode,
            runtime: Date.now() - t0,
            timedOut: res.timedOut,
          });
        }

        socket.emit('compile:batch:done', { total: inputs.length });

      } catch (err) {
        socket.emit('compile:error', { message: String(err) });
      } finally {
        isCompiling = false;
        await Promise.allSettled([
          unlink(srcFile).catch(() => { }),
          unlink(binFile).catch(() => { }),
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
