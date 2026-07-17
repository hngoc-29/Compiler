// public/wasm-worker.js

let inputBuffer = [];

self.onmessage = async (e) => {
    const { type, code, input, langId, data } = e.data;

    if (type === 'stdin') {
        inputBuffer.push(...data.split('\n'));
        return;
    }

    if (type === 'run-python') {
        try {
            if (!self.pyodide) {
                self.postMessage({ type: 'status', status: 'loading-pyodide' });
                importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');
                self.pyodide = await loadPyodide();
            }

            self.postMessage({ type: 'status', status: 'running' });

            // Redirect stdout/stderr
            self.pyodide.setStdout({ batched: (msg) => self.postMessage({ type: 'stdout', chunk: msg + '\n' }) });
            self.pyodide.setStderr({ batched: (msg) => self.postMessage({ type: 'stderr', chunk: msg + '\n' }) });

            // Handle stdin
            inputBuffer = input ? input.split('\n') : [];
            self.pyodide.setStdin({ stdin: () => inputBuffer.shift() || '' });

            const t0 = Date.now();
            await self.pyodide.runPythonAsync(code);
            const runtime = Date.now() - t0;

            self.postMessage({ type: 'done', result: { exitCode: 0, runtime, timedOut: false } });
        } catch (err) {
            self.postMessage({ type: 'done', result: { exitCode: 1, runtime: 0, timedOut: false, compileError: err.toString() } });
        }
    } else if (type === 'run-cpp') {
        try {
            self.postMessage({ type: 'status', status: 'running' });

            inputBuffer = input ? input.split('\n') : [];

            self.Module = {
                print: (text) => self.postMessage({ type: 'stdout', chunk: text + '\n' }),
                printErr: (text) => self.postMessage({ type: 'stderr', chunk: text + '\n' }),
                stdin: () => {
                    if (inputBuffer.length === 0) return null;
                    const line = inputBuffer.shift();
                    return line + '\n';
                },
                quit: (status, toThrow) => {
                    self.postMessage({ type: 'done', result: { exitCode: status, runtime: Date.now() - self.t0, timedOut: false } });
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
                            self.postMessage({ type: 'done', result: { exitCode: 0, runtime: Date.now() - self.t0, timedOut: false } });
                        } catch (e) {
                            if (e.name !== 'ExitStatus') {
                                self.postMessage({ type: 'done', result: { exitCode: 1, runtime: Date.now() - self.t0, timedOut: false, compileError: e.toString() } });
                            }
                        }
                    };
                } else {
                    try {
                        self.Module.callMain([]);
                        self.postMessage({ type: 'done', result: { exitCode: 0, runtime: Date.now() - self.t0, timedOut: false } });
                    } catch (e) {
                        if (e.name !== 'ExitStatus') {
                            self.postMessage({ type: 'done', result: { exitCode: 1, runtime: Date.now() - self.t0, timedOut: false, compileError: e.toString() } });
                        }
                    }
                }
            }
        } catch (err) {
            self.postMessage({ type: 'done', result: { exitCode: 1, runtime: 0, timedOut: false, compileError: err.toString() } });
        }
    }
};
