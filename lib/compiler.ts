/**
 * lib/compiler.ts  v2
 * Compile và chạy nhiều ngôn ngữ: C++, C, Python 3
 * KHÔNG import file này ở phía client/browser.
 */

import { spawn } from 'child_process';
import { readFile, writeFile, mkdir, rm, readdir, stat } from 'fs/promises';
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
  /** Files the running program created or modified (e.g. ofstream to an
   *  .OUT file), read back after the run so they can be shown in the UI. */
  outputFiles?: { name: string; content: string; size: number }[];
}

const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const COMPILE_TIMEOUT = 30_000;

function runProcess(
  cmd: string,
  args: string[],
  stdinData: string,
  timeoutMs: number,
  cwd?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  return new Promise((resolve) => {
    // cwd: without this, relative file paths in the running program (e.g.
    // ifstream fin("input.inp")) resolve against the Next.js server's own
    // working directory instead of the run's actual temp directory —
    // confirmed empirically elsewhere in this codebase (see server.js).
    const proc = spawn(cmd, args, { shell: false, cwd });
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
  extraFiles: unknown = [],
): Promise<{ jsCode: string | null; compileError: string | null }> {
  const lang = getLangById(langId);
  const id = randomUUID();
  // Isolated per-run directory — same collision-safety fix as
  // compileAndRun/compileAndRunStream (two concurrent compiles with an extra
  // file of the same name used to be able to clobber each other).
  const runDir = join(os.tmpdir(), `wasm_${id}`);
  const srcFile = join(runDir, `main.${lang.ext}`);
  const jsFile = join(runDir, `main.js`);

  const safeExtras = sanitizeExtraFiles(extraFiles);
  const extraPaths = safeExtras.map(f => ({ ...f, path: join(runDir, f.name) }));

  try {
    await mkdir(runDir, { recursive: true });
    await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });
    await Promise.all(extraPaths.map(f => writeFile(f.path, f.content, { encoding: 'utf-8', mode: 0o644 })));

    const optFlag = optimize ? '-O2' : '-O0';
    const stdFlag = lang.args.find(a => a.startsWith('-std=')) ?? '-std=c++20';
    const emccPath = getEmccPath();
    // -I points at the bits/stdc++.h shim (see ensureWasmShimHeaders above).
    const shimDir = await ensureWasmShimHeaders();
    const extraSources = extraPaths
      .filter(f => /\.(cpp|cc|cxx|c)$/i.test(f.name))
      .map(f => f.path);

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
      //
      // Also exporting 'FS': Module.print/printErr are LINE-buffered by
      // design (Emscripten's own Filesystem API docs confirm this — a write
      // with no trailing newline never reaches them until the program exits).
      // The worker now drives true per-character stdout/stderr via the
      // lower-level FS.init(input, output, error) API instead, which needs
      // FS exported to be reachable as Module.FS from our code.
      '-s', "EXPORTED_RUNTIME_METHODS=['callMain','FS']",
      '-s', 'FORCE_FILESYSTEM=1',
      '-o', jsFile,
      srcFile, ...extraSources,
    ];

    const compileRes = await runProcess(emccPath, emccArgs, '', COMPILE_TIMEOUT, runDir);
    if (compileRes.exitCode !== 0) {
      return {
        jsCode: null,
        compileError: compileRes.stderr || 'WASM compilation failed',
      };
    }

    const jsCode = await readFile(jsFile, 'utf-8');
    return { jsCode, compileError: null };

  } finally {
    await rm(runDir, { recursive: true, force: true }).catch(() => { });
  }
}

export interface ExtraFileInput {
  name: string;
  content: string;
}

// Same safety boundary as server.js's sanitizeExtraFiles — extra files come
// from the client, so filenames must be constrained before ever touching the
// filesystem (no path separators, no "..", no absolute paths).
const SAFE_FILENAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/;
function sanitizeExtraFiles(extraFiles: unknown): ExtraFileInput[] {
  if (!Array.isArray(extraFiles)) return [];
  const seen = new Set<string>();
  const out: ExtraFileInput[] = [];
  for (const f of extraFiles) {
    if (!f || typeof f !== 'object') continue;
    const name = typeof (f as ExtraFileInput).name === 'string' ? (f as ExtraFileInput).name.trim() : '';
    const content = typeof (f as ExtraFileInput).content === 'string' ? (f as ExtraFileInput).content : null;
    if (content === null) continue;
    if (!SAFE_FILENAME_RE.test(name) || name.includes('..')) continue;
    if (seen.has(name)) continue;
    if (Buffer.byteLength(content, 'utf-8') > 200 * 1024) continue;
    seen.add(name);
    out.push({ name, content });
    if (out.length >= 20) break;
  }
  return out;
}

// After the program runs, read back any files it created or modified in its
// working directory (e.g. `ofstream fout("BAI1.OUT")`). Mirrors server.js's
// captureOutputFiles exactly — see that copy for the full rationale.
async function captureOutputFiles(runDir: string, excludeNames: Set<string>) {
  const results: { name: string; content: string; size: number }[] = [];
  let names: string[];
  try { names = await readdir(runDir); } catch { return results; }
  for (const name of names) {
    if (excludeNames.has(name)) continue;
    const filePath = join(runDir, name);
    try {
      const st = await stat(filePath);
      if (!st.isFile() || st.size > 500 * 1024) continue;
      const content = await readFile(filePath, 'utf-8');
      results.push({ name, content, size: st.size });
      if (results.length >= 30) break;
    } catch { /* not valid UTF-8 text, or vanished — skip rather than crash */ }
  }
  return results;
}

export async function compileAndRun(
  code: string,
  input: string,
  timeoutMs = 10_000,
  optimize = false,
  langId = 'cpp20',
  extraFiles: unknown = [],
): Promise<CompileResult> {
  const lang = getLangById(langId);
  const id = randomUUID();
  // Isolated per-run directory — see server.js's compileAndRunStream for the
  // full rationale (fixes both a cross-run filename collision and the fact
  // that a spawned process's relative file paths need a cwd to resolve
  // against, which is also what makes file I/O work here at all).
  const runDir = join(os.tmpdir(), `editor_${id}`);
  const srcFile = join(runDir, `main.${lang.ext}`);
  const binFile = join(runDir, `main.out`);

  const safeExtras = sanitizeExtraFiles(extraFiles);
  const extraPaths = safeExtras.map(f => ({ ...f, path: join(runDir, f.name) }));

  try {
    await mkdir(runDir, { recursive: true });
    await writeFile(srcFile, code, { encoding: 'utf-8', mode: 0o644 });
    await Promise.all(extraPaths.map(f => writeFile(f.path, f.content, { encoding: 'utf-8', mode: 0o644 })));

    // ── Python: không cần compile step ───────────────────────────────────
    if (lang.compiler === 'python3') {
      const t0 = Date.now();
      const runRes = await runProcess('python3', [srcFile], input, timeoutMs, runDir);
      // Nếu exitCode != 0 và không phải timeout → coi stderr là lỗi runtime
      const isRuntimeError = runRes.exitCode !== 0 && !runRes.timedOut;
      const outputFiles = await captureOutputFiles(runDir, new Set(['main.py', 'main.out']));
      return {
        stdout: runRes.stdout,
        stderr: isRuntimeError ? '' : runRes.stderr,
        compileError: isRuntimeError ? (runRes.stderr || 'Runtime error') : null,
        exitCode: runRes.exitCode,
        runtime: Date.now() - t0,
        timedOut: runRes.timedOut,
        outputFiles,
      };
    }

    // ── C / C++: compile then run ─────────────────────────────────────────
    const optFlag = optimize ? '-O2' : '-O0';
    const compiler = lang.compiler; // 'g++' or 'gcc'
    const stdFlag = lang.args.find(a => a.startsWith('-std=')) ?? '-std=c++20';
    const warnings = lang.args.filter(a => a.startsWith('-W'));
    const extraLibs = lang.lang === 'c' ? ['-lm'] : [];
    const extraSources = extraPaths
      .filter(f => /\.(cpp|cc|cxx|c)$/i.test(f.name))
      .map(f => f.path);

    const gppArgs = [
      stdFlag, optFlag, '-pipe',
      ...warnings,
      ...extraLibs,
      '-o', binFile, srcFile, ...extraSources,
    ];

    const compileRes = await runProcess(compiler, gppArgs, '', COMPILE_TIMEOUT, runDir);
    if (compileRes.exitCode !== 0) {
      return {
        stdout: '', stderr: '',
        compileError: compileRes.stderr || 'Compilation failed (no output)',
        exitCode: compileRes.exitCode,
        runtime: 0, timedOut: false,
      };
    }

    const t0 = Date.now();
    const runRes = await runProcess(binFile, [], input, timeoutMs, runDir);
    const outputFiles = await captureOutputFiles(runDir, new Set(['main.cpp', 'main.c', 'main.out']));
    return {
      stdout: runRes.stdout,
      stderr: runRes.stderr,
      compileError: null,
      exitCode: runRes.exitCode,
      runtime: Date.now() - t0,
      timedOut: runRes.timedOut,
      outputFiles,
    };

  } finally {
    await rm(runDir, { recursive: true, force: true }).catch(() => { });
  }
}
