/**
 * lib/compiler.ts
 * Compile và chạy C++ bằng g++ + ccache + PCH.
 * KHÔNG import file này ở phía client/browser.
 *
 * Tối ưu tốc độ:
 *   - ccache: cache kết quả compile → lần 2+ gần như instant
 *   - PCH (bits/stdc++.h.gch): parse headers ~0ms thay vì ~2-3s
 *   - -O0 (fast mode): bỏ optimization passes → nhanh hơn -O2 ~2x
 *   - -pipe: dùng pipe thay file tạm giữa các pass → I/O ít hơn
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
const COMPILE_TIMEOUT  = 30_000;            // 30s cho bước compile

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
  optimize  = false,   // false = O0 (nhanh), true = O2 (tối ưu)
): Promise<CompileResult> {
  const id      = randomUUID();
  const tmpDir  = os.tmpdir();
  const srcFile = join(tmpDir, `cppeditor_${id}.cpp`);
  const binFile = join(tmpDir, `cppeditor_${id}.out`);

  // Flags compile:
  //   -O0 / -O2    : tốc độ compile vs tốc độ runtime
  //   -pipe        : dùng pipe thay file tạm giữa các pass (nhanh hơn)
  //   -Wall -Wextra: cảnh báo đầy đủ (phải khớp với flag lúc tạo PCH)
  const optFlag = optimize ? '-O2' : '-O0';
  const gppArgs = [
    `-std=c++20`, optFlag, `-pipe`,
    `-Wall`, `-Wextra`,
    `-o`, binFile, srcFile,
  ];

  // ccache nằm trong PATH (/usr/lib/ccache/g++ → wrapper),
  // nếu không có ccache thì fallback về g++ thường.
  const compiler = 'g++';

  try {
    await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });

    const compileRes = await runProcess(compiler, gppArgs, '', COMPILE_TIMEOUT);

    if (compileRes.exitCode !== 0) {
      return {
        stdout: '', stderr: '',
        compileError: compileRes.stderr || 'Compilation failed (no output)',
        exitCode: compileRes.exitCode,
        runtime: 0, timedOut: false,
      };
    }

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
    await Promise.allSettled([
      unlink(srcFile).catch(() => {}),
      unlink(binFile).catch(() => {}),
    ]);
  }
}
