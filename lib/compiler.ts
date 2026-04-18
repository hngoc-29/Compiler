/**
 * lib/compiler.ts
 * Compile và chạy C++ bằng g++ trên server (Node.js only).
 * KHÔNG import file này ở phía client/browser.
 */

import { spawn }               from 'child_process';
import { writeFile, unlink }   from 'fs/promises';
import { join }                from 'path';
import { randomUUID }          from 'crypto';
import os                      from 'os';

export interface CompileResult {
  stdout:       string;
  stderr:       string;
  compileError: string | null;
  exitCode:     number;
  runtime:      number;   // ms
  timedOut:     boolean;
}

const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;  // 2 MB
const COMPILE_TIMEOUT  = 30_000;            // 30 giây cho bước compile

// ─── Chạy một process, gửi stdin, collect stdout/stderr ───
function runProcess(
  cmd: string,
  args: string[],
  stdinData: string,
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { shell: false });
    let stdout = '', stderr = '', timedOut = false, settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
      setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} }, 1000);
    }, timeoutMs);

    // Ghi stdin
    if (stdinData) {
      proc.stdin.write(stdinData, 'utf-8', () => proc.stdin.end());
    } else {
      proc.stdin.end();
    }

    proc.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES) stdout += chunk.toString('utf-8');
    });
    proc.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES) stderr += chunk.toString('utf-8');
    });

    const finish = (code: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code, timedOut });
    };

    proc.on('close', (code) => finish(code ?? -1));
    proc.on('error', (err) => { stderr += `\nProcess error: ${err.message}`; finish(-1); });
  });
}

// ─── Hàm compile + run chính ───
export async function compileAndRun(
  code: string,
  input: string,
  timeoutMs = 10_000,
): Promise<CompileResult> {
  const id      = randomUUID();
  const tmpDir  = os.tmpdir();
  const srcFile = join(tmpDir, `cppeditor_${id}.cpp`);
  const binFile = join(tmpDir, `cppeditor_${id}.out`);

  try {
    // 1. Ghi source
    await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });

    // 2. Compile
    const compileRes = await runProcess(
      'g++',
      ['-std=c++20', '-O2', '-Wall', '-Wextra', '-o', binFile, srcFile],
      '',
      COMPILE_TIMEOUT,
    );

    if (compileRes.exitCode !== 0) {
      return {
        stdout: '', stderr: '',
        compileError: compileRes.stderr || 'Compilation failed (no output)',
        exitCode: compileRes.exitCode,
        runtime: 0, timedOut: false,
      };
    }

    // 3. Chạy binary
    const t0     = Date.now();
    const runRes = await runProcess(binFile, [], input, timeoutMs);
    const runtime = Date.now() - t0;

    return {
      stdout:       runRes.stdout,
      stderr:       runRes.stderr,
      compileError: null,
      exitCode:     runRes.exitCode,
      runtime,
      timedOut:     runRes.timedOut,
    };
  } finally {
    // 4. Dọn file tạm
    await Promise.allSettled([
      unlink(srcFile).catch(() => {}),
      unlink(binFile).catch(() => {}),
    ]);
  }
}
