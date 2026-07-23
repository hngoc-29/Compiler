// public/wasm-worker.js
//
// VERIFICATION: this whole file only runs inside a browser Web Worker — a
// server-side Node process has no such thing as `self`/DedicatedWorkerGlobalScope.
// Proof, checkable by anyone: open DevTools → sign of a separate "wasm-worker.js"
// thread in the Sources panel (with its own console context selectable in the
// console's top-left dropdown), or just watch DevTools → Network while running
// code: for C++ there's exactly ONE request (POST /api/compile-wasm, the
// compile step) and nothing else during the actual run; for Python there's a
// one-time download of pyodide.js/.wasm from jsdelivr and then silence — no
// request at all happens per run. That silence during execution IS the proof:
// nothing is being sent anywhere to run it.
console.log(`[wasm-worker] booted in ${self.constructor?.name || 'a Worker'} — this file cannot execute anywhere except a browser tab's Worker thread.`);

// ─── Throttled byte-level emitter ──────────────────────────────────────────
// BUG FIX (was: Module.print / pyodide "batched" stdout): both are
// LINE-buffered by design — confirmed in Emscripten's own Filesystem API
// docs ("stdout will use a print function... line-buffered") and Pyodide's
// docs ("A batched handler is only called with complete lines of text").
// A loop like `for(...) cout << i;` (no newline) would never reach either
// callback until the whole program finished — which is exactly why "realtime
// log" still looked stuck/slow with WASM even though the setting was on.
// FS.init()'s output callback and pyodide's `raw` stdout callback both fire
// per BYTE instead, with zero buffering. Posting a message per single byte
// would itself be slow (Worker postMessage overhead), so bytes are collected
// and flushed in small ~80ms bursts — the same throttling used server-side —
// giving smooth, human-visible streaming without flooding postMessage.
function makeByteEmitter(postType, intervalMs = 80) {
    let bytes = [];
    let timer = null;
    const decoder = new TextDecoder('utf-8'); // stateful: handles multi-byte UTF-8 split across flushes
    const flush = () => {
        timer = null;
        if (bytes.length === 0) return;
        const chunk = decoder.decode(new Uint8Array(bytes), { stream: true });
        bytes = [];
        if (chunk) self.postMessage({ type: postType, chunk });
    };
    return {
        pushByte(code) {
            bytes.push(code);
            if (!timer) timer = setTimeout(flush, intervalMs);
        },
        flushNow: flush,
    };
}

// Line-based input queue, used by Python's input() (which is inherently
// line-oriented) and fed by 'stdin' messages from the main thread.
let lineInputBuffer = [];
// Character-code queue, used by C++'s FS.init()-based stdin (see below —
// the low-level FS API is character-by-character, not line-based).
let charInputQueue = [];

function enqueueLineForCpp(line) {
    for (let i = 0; i < line.length; i++) charInputQueue.push(line.charCodeAt(i));
    charInputQueue.push(10); // '\n'
}

let currentMode = null; // 'python' | 'cpp' | null

self.onmessage = async (e) => {
    const { type, code, input, langId, data, extraFiles } = e.data;

    if (type === 'stdin') {
        if (currentMode === 'cpp') {
            enqueueLineForCpp(data.endsWith('\n') ? data.slice(0, -1) : data);
        } else {
            lineInputBuffer.push(...data.split('\n'));
        }
        return;
    }

    if (type === 'run-python') {
        currentMode = 'python';
        try {
            if (!self.pyodide) {
                console.log('[wasm-worker] loading Pyodide runtime from CDN (one-time download, then fully local)...');
                self.postMessage({ type: 'status', status: 'loading-pyodide' });
                const tLoad0 = Date.now();
                importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');
                self.pyodide = await loadPyodide();
                console.log(`[wasm-worker] Pyodide ready in ${Date.now() - tLoad0}ms`);
            }

            console.log('[wasm-worker] running Python entirely inside this Worker thread — no network request is made for this step.');
            self.postMessage({ type: 'status', status: 'running' });

            const stdoutEmitter = makeByteEmitter('stdout');
            const stderrEmitter = makeByteEmitter('stderr');
            // `raw` = true byte-level callback (Pyodide's documented API for
            // this), as opposed to the default `batched` (line-level) one.
            self.pyodide.setStdout({ raw: (byte) => stdoutEmitter.pushByte(byte) });
            self.pyodide.setStderr({ raw: (byte) => stderrEmitter.pushByte(byte) });

            // input() is inherently line-oriented in Python, so the existing
            // line-queue model is correct here (no FS.init-style rework needed).
            lineInputBuffer = input ? input.split('\n') : [];
            self.pyodide.setStdin({ stdin: () => lineInputBuffer.shift() ?? null });

            // Multi-file: write extra .py modules into Pyodide's own virtual
            // filesystem (writeFile is Pyodide's documented FS API) so
            // `import helper` resolves them, matching how the server path
            // makes this work by writing files next to the entry script.
            // Explicitly ensuring '' is on sys.path first, rather than
            // assuming Pyodide's default already includes the cwd, since
            // getting this wrong would silently break every multi-file
            // Python run with a confusing ModuleNotFoundError.
            if (Array.isArray(extraFiles) && extraFiles.length > 0) {
                for (const f of extraFiles) {
                    if (f && typeof f.name === 'string' && typeof f.content === 'string') {
                        try {
                            self.pyodide.FS.writeFile(f.name, f.content);
                        } catch (e) {
                            console.warn(`[wasm-worker] failed to write extra file ${f.name}:`, e);
                        }
                    }
                }
                await self.pyodide.runPythonAsync("import sys\nif '' not in sys.path: sys.path.insert(0, '')");
            }

            const t0 = Date.now();
            await self.pyodide.runPythonAsync(code);
            stdoutEmitter.flushNow();
            stderrEmitter.flushNow();
            const runtime = Date.now() - t0;
            console.log(`[wasm-worker] Python finished in ${runtime}ms (measured locally, in-browser)`);

            self.postMessage({ type: 'done', result: { exitCode: 0, runtime, timedOut: false } });
        } catch (err) {
            self.postMessage({ type: 'done', result: { exitCode: 1, runtime: 0, timedOut: false, compileError: err.toString() } });
        }
    } else if (type === 'run-cpp') {
        currentMode = 'cpp';
        try {
            console.log('[wasm-worker] executing the compiled .wasm module inside this Worker thread. (The C++ → WASM *compile* step happened on the server — a real C++ toolchain can\'t run in a browser — but everything from here on, the actual run, stays local.)');
            self.postMessage({ type: 'status', status: 'running' });

            charInputQueue = [];
            if (input) for (const line of input.split('\n')) enqueueLineForCpp(line);

            const stdoutEmitter = makeByteEmitter('stdout');
            const stderrEmitter = makeByteEmitter('stderr');

            const postDone = (result) => {
                stdoutEmitter.flushNow();
                stderrEmitter.flushNow();
                console.log(`[wasm-worker] C++ finished in ${result.runtime}ms (measured locally, in-browser), exitCode=${result.exitCode}`);
                self.postMessage({ type: 'done', result });
            };

            self.Module = {
                // Safety-net fallback only — if FS.init below isn't honored for
                // some reason, output still reaches the UI instead of vanishing
                // (just line-buffered in that fallback case, same as before).
                print: (text) => { for (let i = 0; i < text.length; i++) stdoutEmitter.pushByte(text.charCodeAt(i)); stdoutEmitter.pushByte(10); },
                printErr: (text) => { for (let i = 0; i < text.length; i++) stderrEmitter.pushByte(text.charCodeAt(i)); stderrEmitter.pushByte(10); },
                preRun: [() => {
                    // BUG FIX: true per-character stdout/stderr via the
                    // lower-level FS.init(input, output, error) API — see
                    // makeByteEmitter comment above for why this replaces
                    // the line-buffered print/printErr callbacks.
                    self.Module.FS.init(
                        () => (charInputQueue.length === 0 ? null : charInputQueue.shift()),
                        (code) => { if (code === null) stdoutEmitter.flushNow(); else stdoutEmitter.pushByte(code); },
                        (code) => { if (code === null) stderrEmitter.flushNow(); else stderrEmitter.pushByte(code); },
                    );
                }],
                quit: (status, toThrow) => {
                    postDone({ exitCode: status, runtime: Date.now() - self.t0, timedOut: false });
                }
            };

            self.t0 = Date.now();

            // BUG FIX: `eval(code)` here used to be a *direct* eval call. Direct eval
            // runs inside the current (nested, async-function) lexical scope, and
            // Emscripten's emitted glue code starts with
            // `var Module = typeof Module != 'undefined' ? Module : {};`.
            // Because of `var` hoisting, that declaration creates a LOCAL `Module`
            // binding for the whole eval'd script *before* the RHS even runs — so
            // `typeof Module` always saw the hoisted-but-unassigned local (`undefined`),
            // never our pre-configured `self.Module` above. The glue code silently
            // built its own throwaway `{}` instead: our print/printErr/stdin/quit
            // hooks were ignored (no stdout/stderr/stdin capture), and afterwards
            // `self.Module.calledRun` / `self.Module.callMain` below were reading
            // properties that were never populated (they belonged to the glue's
            // *real*, disconnected Module object) — so every C++ WASM run crashed
            // with "self.Module.callMain is not a function" instead of executing.
            // `self.eval(...)` is an *indirect* eval, which always runs in the
            // worker's true global scope — there, `var Module` reuses the existing
            // global property instead of shadowing it, so the glue code correctly
            // sees and populates our `self.Module` config object.
            self.eval(code);

            if (self.Module.calledRun !== true) {
                if (self.Module.onRuntimeInitialized) {
                    const old = self.Module.onRuntimeInitialized;
                    self.Module.onRuntimeInitialized = () => {
                        old();
                        try {
                            self.Module.callMain([]);
                            postDone({ exitCode: 0, runtime: Date.now() - self.t0, timedOut: false });
                        } catch (e) {
                            if (e.name !== 'ExitStatus') {
                                postDone({ exitCode: 1, runtime: Date.now() - self.t0, timedOut: false, compileError: e.toString() });
                            }
                        }
                    };
                } else {
                    try {
                        self.Module.callMain([]);
                        postDone({ exitCode: 0, runtime: Date.now() - self.t0, timedOut: false });
                    } catch (e) {
                        if (e.name !== 'ExitStatus') {
                            postDone({ exitCode: 1, runtime: Date.now() - self.t0, timedOut: false, compileError: e.toString() });
                        }
                    }
                }
            }
        } catch (err) {
            self.postMessage({ type: 'done', result: { exitCode: 1, runtime: 0, timedOut: false, compileError: err.toString() } });
        }
    }
};
