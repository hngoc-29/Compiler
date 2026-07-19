/**
 * lib/compiler.ts  v2
 * Compile và chạy nhiều ngôn ngữ: C++, C, Python 3
 * KHÔNG import file này ở phía client/browser.
 */

import { spawn } from 'child_process';
import { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import os from 'os';
import { getLangById } from './languages';

// BUG FIX: emcc's C++ standard library is libc++ (LLVM), not GCC's libstdc++ —
// and `<bits/stdc++.h>` is a libstdc++-only convenience header that just
// #includes "everything". libc++ never ships it at all, on any platform, so
// any competitive-programming-style code using it (extremely common — it's
// literally in this app's own C++ boilerplate) fails WASM compilation with
// "fatal error: 'bits/stdc++.h' file not found" before even reaching the
// user's actual code. We create a one-time shim `bits/stdc++.h` that just
// includes the standard headers people actually mean by it, and point emcc
// at it with -I. This only affects the WASM compile path — the regular g++
// path already has the real one built in (it's a GNU extension).
let wasmShimDirPromise: Promise<string> | null = null;
function ensureWasmShimHeaders(): Promise<string> {
  if (!wasmShimDirPromise) {
    wasmShimDirPromise = (async () => {
      const dir = join(os.tmpdir(), 'cppeditor-wasm-shim');
      const bitsDir = join(dir, 'bits');
      const shimFile = join(bitsDir, 'stdc++.h');
      if (!existsSync(shimFile)) {
        await mkdir(bitsDir, { recursive: true });
        await writeFile(shimFile, WASM_STDCXX_SHIM, { encoding: 'utf-8', mode: 0o644 });
      }
      return dir;
    })();
  }
  return wasmShimDirPromise;
}

const WASM_STDCXX_SHIM = `// Compatibility shim for <bits/stdc++.h> under libc++ (Emscripten/clang).
// Not a GCC header — just includes the standard library headers commonly
// expected from it in competitive-programming code.
#pragma once

// C compatibility
#include <cassert>
#include <cctype>
#include <cerrno>
#include <cfloat>
#include <ciso646>
#include <climits>
#include <clocale>
#include <cmath>
#include <csetjmp>
#include <csignal>
#include <cstdarg>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>

// C++11+
#include <ccomplex>
#if __cplusplus >= 201103L
#include <cfenv>
#include <cinttypes>
#include <cstdbool>
#include <cuchar>
#include <cwchar>
#include <cwctype>
#endif

// Containers
#include <array>
#include <bitset>
#include <deque>
#include <forward_list>
#include <list>
#include <map>
#include <queue>
#include <set>
#include <stack>
#include <unordered_map>
#include <unordered_set>
#include <vector>

// Algorithms / numerics / utilities
#include <algorithm>
#include <bit>
#include <chrono>
#include <complex>
#include <execution>
#include <functional>
#include <iterator>
#include <limits>
#include <locale>
#include <memory>
#include <numeric>
#include <random>
#include <ratio>
#include <regex>
#include <string>
#include <tuple>
#include <type_traits>
#include <typeindex>
#include <typeinfo>
#include <utility>
#include <valarray>

// I/O
#include <fstream>
#include <iomanip>
#include <ios>
#include <iosfwd>
#include <iostream>
#include <istream>
#include <ostream>
#include <sstream>
#include <streambuf>

// Concurrency
#include <atomic>
#include <condition_variable>
#include <future>
#include <mutex>
#include <thread>

// Exceptions / misc
#include <exception>
#include <initializer_list>
#include <new>
#include <stdexcept>
#include <string_view>

#if __cplusplus >= 201703L
#include <any>
#include <charconv>
#include <filesystem>
#include <optional>
#include <variant>
#endif

#if __cplusplus >= 202002L
#include <compare>
#include <concepts>
#include <numbers>
#include <ranges>
#include <span>
#include <version>
#endif
`;

export interface CompileResult {
  stdout: string;
  stderr: string;
  compileError: string | null;
  exitCode: number;
  runtime: number;
  timedOut: boolean;
}

const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const COMPILE_TIMEOUT = 30_000;

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
      setTimeout(() => { try { proc.kill('SIGKILL'); } catch { } }, 1000);
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

function getEmccPath(): string {
  if (existsSync('/home/hn/emsdk/upstream/emscripten/emcc')) {
    return '/home/hn/emsdk/upstream/emscripten/emcc';
  }
  if (existsSync('/opt/emsdk/upstream/emscripten/emcc')) {
    return '/opt/emsdk/upstream/emscripten/emcc';
  }
  return 'emcc';
}

export async function compileToWasm(
  code: string,
  optimize = false,
  langId = 'cpp20',
): Promise<{ jsCode: string | null; compileError: string | null }> {
  const lang = getLangById(langId);
  const id = randomUUID();
  const tmpDir = os.tmpdir();
  const srcFile = join(tmpDir, `wasm_${id}.${lang.ext}`);
  const jsFile = join(tmpDir, `wasm_${id}.js`);

  try {
    await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });

    const optFlag = optimize ? '-O2' : '-O0';
    const stdFlag = lang.args.find(a => a.startsWith('-std=')) ?? '-std=c++20';
    const emccPath = getEmccPath();
    // -I points at the bits/stdc++.h shim (see ensureWasmShimHeaders above).
    const shimDir = await ensureWasmShimHeaders();

    const emccArgs = [
      stdFlag, optFlag,
      '-I', shimDir,
      '-s', 'SINGLE_FILE=1',
      '-s', 'WASM=1',
      '-s', 'EXIT_RUNTIME=1',
      '-s', 'INVOKE_RUN=0', // We will invoke run manually or let it run
      // BUG FIX: wasm-worker.js calls Module.callMain([]) itself (required
      // because INVOKE_RUN=0 above disables automatic execution) — but
      // without exporting it here, that call aborts at runtime with
      // "'callMain' was not exported. add it to EXPORTED_RUNTIME_METHODS".
      // Confirmed against the Emscripten FAQ / settings reference.
      '-s', "EXPORTED_RUNTIME_METHODS=['callMain']",
      '-o', jsFile,
      srcFile,
    ];

    const compileRes = await runProcess(emccPath, emccArgs, '', COMPILE_TIMEOUT);
    if (compileRes.exitCode !== 0) {
      return {
        jsCode: null,
        compileError: compileRes.stderr || 'WASM compilation failed',
      };
    }

    const jsCode = await readFile(jsFile, 'utf-8');
    return { jsCode, compileError: null };

  } finally {
    await Promise.allSettled([
      unlink(srcFile).catch(() => { }),
      unlink(jsFile).catch(() => { }),
    ]);
  }
}

export async function compileAndRun(
  code: string,
  input: string,
  timeoutMs = 10_000,
  optimize = false,
  langId = 'cpp20',
): Promise<CompileResult> {
  const lang = getLangById(langId);
  const id = randomUUID();
  const tmpDir = os.tmpdir();
  const srcFile = join(tmpDir, `editor_${id}.${lang.ext}`);
  const binFile = join(tmpDir, `editor_${id}.out`);

  try {
    await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });

    // ── Python: không cần compile step ───────────────────────────────────
    if (lang.compiler === 'python3') {
      const t0 = Date.now();
      const runRes = await runProcess('python3', [srcFile], input, timeoutMs);
      // Nếu exitCode != 0 và không phải timeout → coi stderr là lỗi runtime
      const isRuntimeError = runRes.exitCode !== 0 && !runRes.timedOut;
      return {
        stdout: runRes.stdout,
        stderr: isRuntimeError ? '' : runRes.stderr,
        compileError: isRuntimeError ? (runRes.stderr || 'Runtime error') : null,
        exitCode: runRes.exitCode,
        runtime: Date.now() - t0,
        timedOut: runRes.timedOut,
      };
    }

    // ── C / C++: compile then run ─────────────────────────────────────────
    const optFlag = optimize ? '-O2' : '-O0';
    const compiler = lang.compiler; // 'g++' or 'gcc'
    const stdFlag = lang.args.find(a => a.startsWith('-std=')) ?? '-std=c++20';
    const warnings = lang.args.filter(a => a.startsWith('-W'));
    const extraLibs = lang.lang === 'c' ? ['-lm'] : [];

    const gppArgs = [
      stdFlag, optFlag, '-pipe',
      ...warnings,
      ...extraLibs,
      '-o', binFile, srcFile,
    ];

    const compileRes = await runProcess(compiler, gppArgs, '', COMPILE_TIMEOUT);
    if (compileRes.exitCode !== 0) {
      return {
        stdout: '', stderr: '',
        compileError: compileRes.stderr || 'Compilation failed (no output)',
        exitCode: compileRes.exitCode,
        runtime: 0, timedOut: false,
      };
    }

    const t0 = Date.now();
    const runRes = await runProcess(binFile, [], input, timeoutMs);
    return {
      stdout: runRes.stdout,
      stderr: runRes.stderr,
      compileError: null,
      exitCode: runRes.exitCode,
      runtime: Date.now() - t0,
      timedOut: runRes.timedOut,
    };

  } finally {
    await Promise.allSettled([
      unlink(srcFile).catch(() => { }),
      unlink(binFile).catch(() => { }),
    ]);
  }
}
