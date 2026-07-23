'use client';

/**
 * components/EditorLayout.tsx  v5
 *
 * New features:
 * - Language/version selector (C++14/17/20, C11, Python3)
 * - Multiple test cases panel with modal editor
 * - Code hash cache (sessionStorage) to skip recompile
 * - Real-time diagnostics (Monaco markers from compile error)
 */

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import { io as ioConnect, type Socket } from 'socket.io-client';

import Header, { type PanelVisibility } from './Header';
import CodeEditor from './CodeEditor';
import InputDrawer from './InputDrawer';
import OutputDrawer from './OutputDrawer';
import OutputPanel, { type CompileResult } from './OutputPanel';
import ResizableDivider from './ResizableDivider';
import TestCasePanel from './TestCasePanel';
import LanguageSelector from './LanguageSelector';
import TemplatesPanel from './TemplatesPanel';
import ShortcutsModal from './ShortcutsModal';
import SettingsPanel from './SettingsPanel';

import { addToHistory } from '@/lib/run-history';

import {
  debounce, AUTOSAVE_KEY, clamp,
} from '@/lib/utils';
import { getLangById, DEFAULT_LANG_ID } from '@/lib/languages';
import { DEFAULT_TEST_CASES, type TestCase, type SavedTestCase, createTestCase, compareOutput, serializeTestCases, deserializeTestCases } from '@/lib/testcases';
import { parseGppDiagnostics, type Diagnostic } from '@/lib/cpp-suggestions';
import { loadSettings, saveSettings, type EditorSettings } from '@/lib/editor-settings';
import { loadShortcuts, saveShortcuts, matchesShortcut, type Shortcuts } from '@/lib/shortcuts';
import { loadPrefs, savePrefs } from '@/lib/user-prefs';
import { Copy, Check, Loader2, Code2, AlignLeft, ClipboardList, MonitorDot, Play, Zap, Gauge, Settings2, Eye, LibrarySquare, Keyboard, Terminal as TerminalIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import LangSelect from '@/components/LangSelect';

const MIN_PX = 120;

// ─── Multi-file ─────────────────────────────────────────────────────────────
export interface ExtraFile {
  id: string;
  name: string;
  content: string;
}

function monacoLangForFilename(name: string): string {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  switch (ext) {
    case 'py': return 'python';
    case 'h': case 'hpp': case 'hh': case 'cpp': case 'cc': case 'cxx': case 'c':
      return 'cpp';
    default: return 'plaintext';
  }
}

// ── File tabs bar — switch between the main file and extra files (headers /
// helper modules). Only rendered meaningfully once there's more than the
// main file; stays out of the way for the (much more common) single-file case.
function FileTabsBar({ mainFileName, extraFiles, activeFileId, onSelect, onAdd, onDelete, addLabel }: {
  mainFileName: string;
  extraFiles: ExtraFile[];
  activeFileId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  addLabel: string;
}) {
  return (
    <div className="flex items-center gap-1 px-2 pt-1.5 bg-bg-base overflow-x-auto shrink-0 border-b border-gray-800/60">
      <button
        onClick={() => onSelect('main')}
        className={`px-2.5 py-1 text-[11px] font-mono rounded-t whitespace-nowrap transition-colors ${
          activeFileId === 'main' ? 'bg-gray-800 text-emerald-300' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        {mainFileName}
      </button>
      {extraFiles.map(f => (
        <span
          key={f.id}
          onClick={() => onSelect(f.id)}
          className={`group flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded-t whitespace-nowrap cursor-pointer transition-colors ${
            activeFileId === f.id ? 'bg-gray-800 text-sky-300' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {f.name}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(f.id); }}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity leading-none"
            title="Delete"
          >
            ×
          </button>
        </span>
      ))}
      <button
        onClick={onAdd}
        title={addLabel}
        className="px-2 py-1 text-[13px] text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 rounded transition-colors shrink-0"
      >
        +
      </button>
    </div>
  );
}

interface EditorLayoutProps {
  initialCode?: string;
  initialInput?: string;
  initialTestCases?: SavedTestCase[];
  initialExtraFiles?: ExtraFile[];
  isSharedView?: boolean;
}

export default function EditorLayout({
  initialCode, initialInput, initialTestCases, initialExtraFiles, isSharedView = false,
}: EditorLayoutProps) {

  const { t } = useI18n();
  const el = t.editorLayout;

  // ─── User preferences (lang, optimize, panels, activeTab) ──────────────────
  // Loaded once at mount; individual state setters persist on every change.
  const _prefs = useState(loadPrefs)[0];

  // ─── Language ────────────────────────────────────────────────────────────
  const [langId, setLangId] = useState(_prefs.langId);
  const lang = getLangById(langId);

  // ─── Content ─────────────────────────────────────────────────────────────
  const [code, setCode] = useState(initialCode ?? lang.hello);
  // ─── Multi-file (headers / helper modules alongside the main file) ────────
  // Kept ADDITIVE and separate from `code` on purpose: `code` stays exactly
  // what it's always been (the main file's content), so every existing path
  // that reads it (sharing, local storage, run history, templates, the HTTP
  // fallback API) keeps working completely unchanged for the common
  // single-file case. Multi-file users get `extraFiles` on top.
  const [extraFiles, setExtraFiles] = useState<ExtraFile[]>(initialExtraFiles ?? []);
  // 'main' = editing `code`; otherwise the id of an ExtraFile being edited.
  const [activeFileId, setActiveFileId] = useState<string>('main');
  const activeExtraFile = extraFiles.find(f => f.id === activeFileId) ?? null;
  const mainFileName = lang.ext === 'py' ? 'main.py' : lang.ext === 'c' ? 'main.c' : 'main.cpp';
  const editorValue = activeExtraFile ? activeExtraFile.content : code;
  const editorPath = activeExtraFile ? activeExtraFile.name : mainFileName;
  const editorLanguage = activeExtraFile ? monacoLangForFilename(activeExtraFile.name) : lang.monacoLang;
  const handleEditorChange = useCallback((v: string | undefined) => {
    const next = v ?? '';
    if (activeExtraFile) {
      setExtraFiles(prev => prev.map(f => f.id === activeExtraFile.id ? { ...f, content: next } : f));
    } else {
      setCode(next);
    }
  }, [activeExtraFile]);
  const handleAddFile = useCallback(() => {
    const name = window.prompt(el.newFilePrompt)?.trim();
    if (!name) return;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/.test(name) || name.includes('..')) {
      toast.error(el.invalidFileName);
      return;
    }
    if (name === mainFileName || extraFiles.some(f => f.name === name)) {
      toast.error(el.duplicateFileName);
      return;
    }
    const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setExtraFiles(prev => [...prev, { id, name, content: '' }]);
    setActiveFileId(id);
  }, [extraFiles, mainFileName, el]);
  const handleDeleteFile = useCallback((id: string) => {
    setExtraFiles(prev => prev.filter(f => f.id !== id));
    setActiveFileId(prev => prev === id ? 'main' : prev);
  }, []);
  const [output, setOutput] = useState<CompileResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [optimize, setOptimize] = useState(_prefs.optimize);
  const [streamStdout, setStreamStdout] = useState('');
  // True once the server/worker confirms the compile step is done and the
  // program itself has started running (see BUG FIX note on isLoading below).
  const [isActuallyRunning, setIsActuallyRunning] = useState(false);
  // Explicit interactive-mode toggle (replaces the old implicit "input box
  // is empty = interactive" heuristic — that guess was invisible/surprising;
  // this is a switch the person actually sees and controls). When on, the
  // pre-filled Input box is hidden and input is typed live in the Output
  // panel while the program runs instead.
  const [interactiveMode, setInteractiveMode] = useState(false);
  // Shared accumulator for streamed stdout — a plain closure `let buf` inside
  // handleRun wasn't reachable from handleSendStdin, so echoing a typed line
  // (via a separate functional setState) could get silently wiped out the
  // next time a real output chunk arrived (that path did an ABSOLUTE
  // setStreamStdout(buf), overwriting whatever the echo had just added). One
  // shared ref = one source of truth, no clobbering in either direction.
  const streamBufRef = useRef('');

  // ─── Diagnostics (from last compile error → Monaco markers) ──────────────
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  // ─── Editor Settings ─────────────────────────────────────────────────────
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);
  const [shortcuts, setShortcuts] = useState<Shortcuts>(loadShortcuts);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const handleSettingsChange = (s: EditorSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  const handleShortcutsChange = (s: Shortcuts) => {
    setShortcuts(s);
    saveShortcuts(s);
  };

  // ─── Test cases ──────────────────────────────────────────────────────────
  const [testCases, setTestCases] = useState<TestCase[]>(
    initialTestCases ? deserializeTestCases(initialTestCases) : DEFAULT_TEST_CASES
  );
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningTcId, setRunningTcId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'testcases'>(_prefs.activeTab);

  // Single-run input (for backward compat with single tab)
  const singleInput = testCases[0]?.input ?? '';
  const setSingleInput = (v: string) => {
    setTestCases(prev => prev.map((tc, i) => i === 0 ? { ...tc, input: v } : tc));
  };

  // ─── Panel visibility ────────────────────────────────────────────────────
  const [panels, setPanels] = useState<PanelVisibility>(_prefs.panels);

  // ─── Mobile ──────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  const [inputDrawerOpen, setInputDrawerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'code' | 'input' | 'tests' | 'output'>('code');

  // ─── Desktop resize ──────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [codeW, setCodeW] = useState(0);
  const [inputW, setInputW] = useState(0);

  // ─── Viewport height ─────────────────────────────────────────────────────
  const [viewH, setViewH] = useState<string>('100dvh');

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let rafId = 0;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setViewH(`${Math.round(vv.height)}px`));
    };
    const onFocusOut = () => setTimeout(update, 150);
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusout', onFocusOut);
    update();
    return () => {
      cancelAnimationFrame(rafId);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const t = containerRef.current.offsetWidth;
    const { panelWidths } = loadPrefs();
    setCodeW(Math.floor(t * panelWidths.codeRatio));
    setInputW(Math.floor(t * panelWidths.inputRatio));
  }, []);

  // ─── Persist panel widths (debounced 500ms after last drag) ─────────────
  const saveWidthsRef = useRef<ReturnType<typeof debounce> | null>(null);
  useEffect(() => {
    saveWidthsRef.current = debounce((cW: number, iW: number) => {
      if (!containerRef.current) return;
      const total = containerRef.current.offsetWidth;
      if (total <= 0) return;
      const prefs = loadPrefs();
      savePrefs({ ...prefs, panelWidths: { codeRatio: cW / total, inputRatio: iW / total } });
    }, 500) as unknown as ReturnType<typeof debounce>;
  }, []);

  useEffect(() => {
    if (codeW > 0 && inputW > 0) {
      saveWidthsRef.current?.(codeW, inputW);
    }
  }, [codeW, inputW]);

  const handleTogglePanel = useCallback((key: keyof PanelVisibility) => {
    setPanels(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) return prev;
      // Persist panel visibility
      savePrefs({ ...loadPrefs(), panels: next });
      return next;
    });
  }, []);

  const handleDragCode = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const total = containerRef.current.offsetWidth;
    const maxW = total - (panels.input ? MIN_PX : 0) - (panels.output ? MIN_PX : 0) - 8;
    setCodeW(prev => clamp(prev + delta, MIN_PX, maxW));
  }, [panels]);

  const handleDragInput = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const total = containerRef.current.offsetWidth;
    const usedByCode = panels.code ? codeW : 0;
    const maxW = total - usedByCode - (panels.output ? MIN_PX : 0) - 8;
    setInputW(prev => clamp(prev + delta, MIN_PX, maxW));
  }, [panels, codeW]);

  // ─── Auto-save ────────────────────────────────────────────────────────────
  const autoSaveFn = useRef<ReturnType<typeof debounce> | null>(null);
  useEffect(() => {
    autoSaveFn.current = debounce(async (c: string, tcs: TestCase[], xf: ExtraFile[]) => {
      try {
        const { compressToBase64Url } = await import('@/lib/compress');
        const payload = JSON.stringify({
          code: c,
          input: tcs[0]?.input ?? '',          // keep for backwards compat
          testCases: serializeTestCases(tcs),
          extraFiles: xf,
        });
        const compressed = await compressToBase64Url(payload);
        localStorage.setItem(AUTOSAVE_KEY, compressed);
      } catch (err) { console.warn('[AutoSave]', err); }
    }, 800) as unknown as ReturnType<typeof debounce>;
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (isSharedView) return; // Don't overwrite own code when viewing a shared link
    autoSaveFn.current?.(code, testCases, extraFiles);
  }, [code, testCases, extraFiles, isReady, isSharedView]);

  useEffect(() => {
    if (initialCode !== undefined || initialInput !== undefined || initialTestCases !== undefined) {
      // Shared view: initialTestCases/initialExtraFiles already applied via useState initialiser.
      // Apply initialInput only as backwards-compat fallback (old links without testCases).
      if (initialInput !== undefined && initialTestCases === undefined) {
        setSingleInput(initialInput);
      }
      setIsReady(true); return;
    }
    (async () => {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) { setIsReady(true); return; }
      try {
        const { decompressFromBase64Url } = await import('@/lib/compress');
        const parsed = JSON.parse(await decompressFromBase64Url(saved));
        if (parsed?.code !== undefined) setCode(parsed.code);
        if (Array.isArray(parsed?.testCases)) {
          // New format: restore full test cases
          setTestCases(deserializeTestCases(parsed.testCases));
        } else if (parsed?.input !== undefined) {
          // Old format: only had a single input
          setSingleInput(parsed.input);
        }
        if (Array.isArray(parsed?.extraFiles)) {
          setExtraFiles(parsed.extraFiles.filter((f: unknown): f is ExtraFile =>
            !!f && typeof f === 'object' && typeof (f as ExtraFile).id === 'string' &&
            typeof (f as ExtraFile).name === 'string' && typeof (f as ExtraFile).content === 'string'));
        }
      } catch { localStorage.removeItem(AUTOSAVE_KEY); }
      finally { setIsReady(true); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Language change: reset code to hello world if current is default ────
  const handleLangChange = useCallback((newId: string) => {
    const newLang = getLangById(newId);
    setLangId(newId);
    // Only reset code if it's still the default hello world of old lang
    const oldLang = getLangById(langId);
    if (code.trim() === oldLang.hello.trim()) {
      setCode(newLang.hello);
    }
    setDiagnostics([]);
    setOutput(null);
    // Persist language choice
    savePrefs({ ...loadPrefs(), langId: newId });
  }, [langId, code]);

  // ─── Socket.IO & WASM Worker ──────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const wasmWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const socket = ioConnect({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  useEffect(() => {
    if (settings.useWasm && !wasmWorkerRef.current) {
      wasmWorkerRef.current = new Worker('/wasm-worker.js');
    }
    return () => {
      if (wasmWorkerRef.current) {
        wasmWorkerRef.current.terminate();
        wasmWorkerRef.current = null;
      }
    };
  }, [settings.useWasm]);

  // ─── Core: chạy code 1 lần, trả về Promise<CompileResult> ──────────────────
  // Ưu tiên WebSocket (nhanh hơn, streaming), fallback sang HTTP.
  // Không cache — mỗi lần chạy là chạy mới với đúng input của nó.
  const runOnce = useCallback((
    codeToRun: string,
    inputToRun: string,
    onStdoutChunk?: (chunk: string) => void,
    interactive: boolean = false,
    onStatus?: (status: string) => void,
  ): Promise<CompileResult> => {
    // BUG FIX: this used to pass `settings.runTimeoutMs` (10s by default)
    // unconditionally as the hard kill timeout, even for interactive runs.
    // An interactive run's clock includes however long the *user* takes to
    // read the prompt and type a reply — 10s is nowhere near enough for real
    // typing/thinking time, so interactive programs were getting killed as
    // "timed out" almost immediately, defeating the whole point of real-time
    // execution. Interactive runs now get a much longer ceiling; the process
    // still can't run forever, but it's no longer punished for waiting on the
    // person actually using it.
    const effectiveTimeoutMs = interactive
      ? Math.max(settings.runTimeoutMs, 120_000)
      : settings.runTimeoutMs;

    if (settings.useWasm) {
      return new Promise(async (resolve, reject) => {
        // BUG FIX: this used to only read wasmWorkerRef.current and reject
        // with "WASM Worker not initialized" if the mount-time useEffect
        // hadn't created it yet (React Strict Mode's mount→cleanup→remount
        // cycle, or toggling the WASM setting right before hitting Run, could
        // both leave this null for a moment). Creating it on demand here
        // removes the race entirely — there's always a worker by the time we
        // need one, regardless of effect timing.
        if (!wasmWorkerRef.current) {
          wasmWorkerRef.current = new Worker('/wasm-worker.js');
        }
        const worker = wasmWorkerRef.current;

        let wasmCode = codeToRun;
        const isPython = langId === 'python3';

        // ── Verification logging ────────────────────────────────────────────
        // Answers "làm sao biết nó có thực sự chạy bằng máy tôi không?" by
        // printing concrete, timestamped proof directly into the output
        // stream (not just DevTools) — every timing here is measured on THIS
        // machine (performance.now() in the tab), and for the C++ path the
        // absence of any further network request after compilation is the
        // proof the run itself never left the browser.
        const engineLog = (line: string) => onStdoutChunk?.(`⚙️ [Engine] ${line}\n`);

        if (!isPython) {
          // Compile C++ to WASM via API
          try {
            engineLog('Đang biên dịch C++ → WASM trên server (bắt buộc — trình duyệt không có trình biên dịch C++)...');
            const tCompile0 = performance.now();
            const res = await fetch('/api/compile-wasm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: codeToRun, optimize, langId,
                extraFiles: extraFiles.map(f => ({ name: f.name, content: f.content })),
              }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'WASM compilation failed');
            if (data.compileError) {
              return resolve({ stdout: '', stderr: '', compileError: data.compileError, exitCode: 1, runtime: 0, timedOut: false });
            }
            wasmCode = data.jsCode;
            const compileMs = Math.round(performance.now() - tCompile0);
            engineLog(`Biên dịch xong (${compileMs}ms, gồm cả round-trip mạng). Từ đây trở đi chạy 100% trên trình duyệt của bạn — mở DevTools → Network lúc chạy, sẽ không có request nào nữa.`);
          } catch (err) {
            return reject(err);
          }
        } else {
          engineLog('Chạy Python 100% trong Worker thread của trình duyệt — code không được gửi lên server để chạy.');
        }

        let stdoutBuf = '';
        let stderrBuf = '';
        const tRun0 = performance.now();

        const onMessage = (e: MessageEvent) => {
          const { type, chunk, result, status, compileError } = e.data;
          if (type === 'stdout') {
            stdoutBuf += chunk;
            onStdoutChunk?.(chunk);
          } else if (type === 'stderr') {
            stderrBuf += chunk;
          } else if (type === 'status') {
            if (status === 'loading-pyodide') engineLog('Đang tải Pyodide runtime từ CDN (chỉ lần đầu, sau đó cache lại)...');
            onStatus?.(status);
          } else if (type === 'done') {
            worker.removeEventListener('message', onMessage);
            const clientMs = Math.round(performance.now() - tRun0);
            engineLog(`Chạy xong — ${result.runtime}ms đo trong Worker, ${clientMs}ms đo tại tab chính. Cả hai số này đều đo tại máy bạn, không có request mạng nào trong lúc chạy.`);
            resolve({
              stdout: stdoutBuf,
              stderr: stderrBuf,
              compileError: result.compileError || null,
              exitCode: result.exitCode,
              runtime: result.runtime,
              timedOut: result.timedOut,
            });
          }
        };

        worker.addEventListener('message', onMessage);
        worker.postMessage({
          type: isPython ? 'run-python' : 'run-cpp',
          code: wasmCode,
          input: inputToRun,
          langId,
          extraFiles: isPython ? extraFiles.map(f => ({ name: f.name, content: f.content })) : undefined,
        });

        // Timeout handling
        setTimeout(() => {
          worker.removeEventListener('message', onMessage);
          worker.terminate();
          wasmWorkerRef.current = new Worker('/wasm-worker.js'); // recreate
          resolve({
            stdout: stdoutBuf,
            stderr: stderrBuf,
            compileError: null,
            exitCode: -1,
            runtime: effectiveTimeoutMs,
            timedOut: true,
          });
        }, effectiveTimeoutMs);
      });
    }

    return new Promise((resolve, reject) => {
      const socket = socketRef.current;

      if (socket?.connected) {
        onStdoutChunk?.('⚙️ [Engine] Biên dịch & chạy trên server (không dùng tài nguyên máy bạn). Bật "Chạy trên trình duyệt (WASM)" trong Cài đặt để so sánh.\n');
        const onStdout = (chunk: string) => onStdoutChunk?.(chunk);
        const onStatusEvt = (s: string) => onStatus?.(s);
        const onDone = (result: CompileResult) => { off(); resolve(result); };
        const onErr = (e: { message?: string }) => {
          off();
          reject(new Error(e?.message || 'Socket error'));
        };
        const off = () => {
          socket.off('compile:stdout', onStdout);
          socket.off('compile:status', onStatusEvt);
          socket.off('compile:done', onDone);
          socket.off('compile:error', onErr);
        };
        socket.on('compile:stdout', onStdout);
        socket.on('compile:status', onStatusEvt);
        socket.on('compile:done', onDone);
        socket.on('compile:error', onErr);
        socket.emit('compile', {
          code: codeToRun, input: inputToRun, optimize, langId,
          timeoutMs: effectiveTimeoutMs, interactive, realtime: settings.realtimeLogs,
          extraFiles: extraFiles.map(f => ({ name: f.name, content: f.content })),
        });
      } else {
        // HTTP fallback
        fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeToRun, input: inputToRun, optimize, langId, timeoutMs: settings.runTimeoutMs,
            extraFiles: extraFiles.map(f => ({ name: f.name, content: f.content })),
          }),
        })
          .then(res => res.ok
            ? res.json()
            : res.json().then((e: { error?: string }) => Promise.reject(new Error(e.error || `HTTP ${res.status}`)))
          )
          .then(resolve)
          .catch(reject);
      }
    });
  }, [optimize, langId, settings.runTimeoutMs, settings.realtimeLogs, extraFiles]);

  const handleSendStdin = useCallback((data: string) => {
    // Echo what was typed into the transcript, right where it was sent — a
    // real terminal always shows your own input inline; without this the
    // "terminal" just silently swallowed whatever you typed, out of sync
    // with the actual program's cin/input() calls that consumed it.
    const echoLine = data.endsWith('\n') ? data.slice(0, -1) : data;
    streamBufRef.current += `» ${echoLine}\n`;
    setStreamStdout(streamBufRef.current);

    if (settings.useWasm && wasmWorkerRef.current) {
      wasmWorkerRef.current.postMessage({ type: 'stdin', data });
    } else {
      socketRef.current?.emit('compile:stdin', data);
    }
  }, [settings.useWasm]);

  const handleEndStdin = useCallback(() => {
    if (!settings.useWasm) {
      socketRef.current?.emit('compile:stdin:end');
    }
  }, [settings.useWasm]);

  // ─── Stop a running program ────────────────────────────────────────────────
  // Server path: real Ctrl+C (SIGINT) sent to the process, same as a terminal.
  // WASM path: a running WASM/Pyodide computation can't be "signaled" from the
  // outside mid-instruction — the only reliable way to actually stop it is to
  // terminate the whole Worker (same technique already used for the timeout
  // case) and spin up a fresh one so the next Run isn't left in a broken state.
  const handleStop = useCallback(() => {
    if (settings.useWasm && wasmWorkerRef.current) {
      wasmWorkerRef.current.terminate();
      wasmWorkerRef.current = new Worker('/wasm-worker.js');
      setIsCompiling(false);
      setIsActuallyRunning(false);
      toast.dismiss('run');
      setOutput({ stdout: streamBufRef.current, stderr: '', compileError: null, exitCode: -1, runtime: 0, timedOut: false, stopped: true });
      streamBufRef.current = '';
      setStreamStdout('');
      toast.info(el.stoppedToast);
    } else {
      socketRef.current?.emit('compile:stop');
    }
  }, [settings.useWasm, el]);

  // ─── Run single (main input) ──────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setIsActuallyRunning(false);
    setOutput(null);
    setStreamStdout('');
    setDiagnostics([]);
    setPanels(prev => ({ ...prev, output: true }));
    toast.info(el.compilingToast, { id: 'run', duration: 15000 });

    streamBufRef.current = '';
    try {
      const result = await runOnce(code, singleInput, (chunk) => {
        streamBufRef.current += chunk;
        setStreamStdout(streamBufRef.current);
      }, interactiveMode, (status) => setIsActuallyRunning(status === 'running'));

      toast.dismiss('run');
      setOutput(result);
      setStreamStdout('');
      if (isMobile) setMobileTab('output');

      // Save to run history
      addToHistory({
        langId, code, input: singleInput,
        stdout: result.stdout, stderr: result.stderr,
        compileError: result.compileError, exitCode: result.exitCode,
        runtime: result.runtime, timedOut: result.timedOut,
      });

      if (result.compileError) {
        setDiagnostics(parseGppDiagnostics(result.compileError));
        toast.error(el.compileError);
      } else {
        setDiagnostics([]);
        if (result.stopped) toast.info(el.stoppedToast);
        else if (result.timedOut) toast.warning(el.timeoutWarning);
        else if (result.exitCode !== 0) toast.warning(`⚠️ Exit ${result.exitCode}`);
        else toast.success(`✅ OK · ${result.runtime}ms`);
      }
    } catch (err) {
      toast.dismiss('run');
      toast.error(err instanceof Error ? err.message : el.cannotConnect);
    } finally {
      setIsCompiling(false);
      setIsActuallyRunning(false);
    }
  }, [code, singleInput, isCompiling, isMobile, runOnce, interactiveMode, el]);

  // ─── Run one test case ────────────────────────────────────────────────────
  const handleRunOne = useCallback(async (tc: TestCase) => {
    if (runningTcId || isRunningAll) return;
    setRunningTcId(tc.id);
    // Reset output của test case này trước khi chạy
    setTestCases(prev => prev.map(t => t.id === tc.id
      ? { ...t, status: 'running', output: null, error: null, runtime: 0 }
      : t));

    try {
      const result = await runOnce(code, tc.input);

      if (result.compileError) setDiagnostics(parseGppDiagnostics(result.compileError));

      const hasExpected = tc.expectedOutput?.trim().length > 0;
      let status: TestCase['status'];
      if (result.compileError) status = 'error';
      else if (result.timedOut) status = 'timeout';
      else if (result.exitCode !== 0) status = 'error';
      else if (hasExpected && !compareOutput(result.stdout, tc.expectedOutput)) status = 'wrong';
      else status = 'ok';

      setTestCases(prev => prev.map(t => t.id === tc.id ? {
        ...t, status,
        output: result.compileError ? null : result.stdout,
        error: result.compileError ?? (result.stderr || null),
        runtime: result.runtime,
      } : t));

      if (status === 'error') toast.error(`❌ ${tc.label}: ${result.compileError ? t.ui.badges.compileError : `Exit ${result.exitCode}`}`);
      else if (status === 'timeout') toast.warning(`⏱ ${tc.label}: Timeout`);
      else if (status === 'wrong') toast.error(`❌ ${tc.label}: Wrong Answer`);
      else toast.success(`✅ ${tc.label}: ${hasExpected ? 'PASS' : `OK · ${result.runtime}ms`}`);
    } catch (err) {
      setTestCases(prev => prev.map(t => t.id === tc.id
        ? { ...t, status: 'error', error: err instanceof Error ? err.message : el.cannotConnect }
        : t));
    } finally {
      setRunningTcId(null);
    }
  }, [code, runningTcId, isRunningAll, runOnce]);

  // ─── Run ALL test cases — compile 1 lần, chạy N lần ─────────────────────
  const handleRunAll = useCallback(async () => {
    if (isRunningAll || isCompiling) return;
    setIsRunningAll(true);
    setDiagnostics([]);

    const snapshot = [...testCases];
    // Reset tất cả về idle
    setTestCases(prev => prev.map(tc => ({
      ...tc, status: 'idle', output: null, error: null, runtime: 0,
    })));

    const socket = socketRef.current;

    // ── WebSocket batch path ───────────────────────────────────────────────
    if (socket?.connected) {
      await new Promise<void>((resolve) => {
        let passCount = 0, failCount = 0, errCount = 0;

        const onStatus = (s: string) => {
          if (s === 'compiling') {
            toast.info(el.batchCompiling, { id: 'batch', duration: 60_000 });
          } else if (s === 'running') {
            toast.info(el.batchRunning(snapshot.length), { id: 'batch', duration: 60_000 });
            // Đánh dấu test đầu tiên là đang chạy
            if (snapshot[0])
              setTestCases(prev => prev.map(t =>
                t.id === snapshot[0].id ? { ...t, status: 'running' } : t));
          }
        };

        // Compile thất bại → báo lỗi tất cả, dừng
        const onCompileError = (e: { stderr: string }) => {
          toast.dismiss('batch');
          toast.error('❌ Compile error!');
          setDiagnostics(parseGppDiagnostics(e.stderr));
          setTestCases(prev => prev.map(t => ({
            ...t, status: 'error', error: e.stderr,
          })));
          off(); resolve();
        };

        // Nhận kết quả từng test case khi chạy xong
        const onResult = (data: {
          index: number;
          stdout: string; stderr: string;
          exitCode: number; runtime: number; timedOut: boolean;
        }) => {
          const tc = snapshot[data.index];
          const next = snapshot[data.index + 1];
          if (!tc) return;

          // Đánh dấu test tiếp theo là đang chạy (real-time feedback)
          if (next)
            setTestCases(prev => prev.map(t =>
              t.id === next.id ? { ...t, status: 'running' } : t));

          const hasExpected = tc.expectedOutput?.trim().length > 0;
          let status: TestCase['status'];
          if (data.timedOut) status = 'timeout';
          else if (data.exitCode !== 0) status = 'error';
          else if (hasExpected && !compareOutput(data.stdout, tc.expectedOutput)) status = 'wrong';
          else status = 'ok';

          if (status === 'ok') passCount++;
          else if (status === 'wrong') failCount++;
          else errCount++;

          setTestCases(prev => prev.map(t => t.id === tc.id ? {
            ...t, status,
            output: data.stdout,
            error: data.stderr || null,
            runtime: data.runtime,
          } : t));
        };

        const onDone = () => {
          toast.dismiss('batch');
          const total = snapshot.length;
          if (failCount > 0 || errCount > 0)
            toast.error(`${passCount}/${total} PASS · ${failCount} FAIL · ${errCount} ERR`);
          else
            toast.success(`✅ ${passCount}/${total} PASS`);
          off(); resolve();
        };

        const onErr = (e: { message?: string }) => {
          toast.dismiss('batch');
          toast.error(e?.message || 'Unknown error');
          off(); resolve();
        };

        const off = () => {
          socket.off('compile:batch:status', onStatus);
          socket.off('compile:batch:error', onCompileError);
          socket.off('compile:batch:result', onResult);
          socket.off('compile:batch:done', onDone);
          socket.off('compile:error', onErr);
        };

        socket.on('compile:batch:status', onStatus);
        socket.on('compile:batch:error', onCompileError);
        socket.on('compile:batch:result', onResult);
        socket.on('compile:batch:done', onDone);
        socket.on('compile:error', onErr);

        socket.emit('compile:batch', {
          code,
          inputs: snapshot.map(tc => tc.input),
          optimize,
          langId,
        });
      });

      // ── HTTP fallback (WebSocket không kết nối được) ───────────────────────
    } else {
      let passCount = 0, failCount = 0, errCount = 0;
      for (const tc of snapshot) {
        setRunningTcId(tc.id);
        setTestCases(prev => prev.map(t =>
          t.id === tc.id ? { ...t, status: 'running' } : t));
        try {
          const result = await runOnce(code, tc.input);
          if (result.compileError) {
            setDiagnostics(parseGppDiagnostics(result.compileError));
            setTestCases(prev => prev.map(t => ({
              ...t, status: 'error', error: result.compileError,
            })));
            errCount = snapshot.length;
            break;
          }
          const hasExpected = tc.expectedOutput?.trim().length > 0;
          let status: TestCase['status'];
          if (result.timedOut) status = 'timeout';
          else if (result.exitCode !== 0) status = 'error';
          else if (hasExpected && !compareOutput(result.stdout, tc.expectedOutput)) status = 'wrong';
          else status = 'ok';

          if (status === 'ok') passCount++;
          else if (status === 'wrong') failCount++;
          else errCount++;

          setTestCases(prev => prev.map(t => t.id === tc.id ? {
            ...t, status,
            output: result.stdout, error: result.stderr || null, runtime: result.runtime,
          } : t));
        } catch (err) {
          errCount++;
          setTestCases(prev => prev.map(t => t.id === tc.id
            ? { ...t, status: 'error', error: err instanceof Error ? err.message : 'Network error' }
            : t));
        }
      }
      const total = snapshot.length;
      if (failCount > 0 || errCount > 0)
        toast.error(`${passCount}/${total} PASS · ${failCount} FAIL · ${errCount} ERR`);
      else
        toast.success(`✅ ${passCount}/${total} PASS`);
    }

    setRunningTcId(null);
    setIsRunningAll(false);
  }, [code, testCases, isRunningAll, isCompiling, runOnce, langId, optimize]);

  // ─── Global Shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const isTextField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      // A shortcut with no Ctrl/Cmd/Alt (e.g. someone customizes "run" to just
      // "R") shouldn't fire while the user is simply typing that letter into
      // the Input box or the live stdin field — only fire modifier-free
      // shortcuts when focus isn't in an editable text field.
      const hasModifierPart = /ctrl|cmd|alt|meta/.test(shortcuts.run.toLowerCase());
      if ((hasModifierPart || !isTextField) && matchesShortcut(e, shortcuts.run)) {
        e.preventDefault();
        if (activeTab === 'testcases') handleRunAll();
        else handleRun();
      }
      // '?' opens shortcuts modal (not in input/textarea)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)) {
        setShortcutsOpen(v => !v);
      }
      // Ctrl+C → stop the running program, mirroring a real terminal — but
      // only when there's no text selected, so copying output with Ctrl+C
      // (the normal, expected browser behavior) still works untouched.
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'c' && isCompiling) {
        const hasSelection = (window.getSelection()?.toString().length ?? 0) > 0;
        if (!hasSelection) {
          e.preventDefault();
          handleStop();
        }
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handleRun, handleRunAll, activeTab, shortcuts, isCompiling, handleStop]);


  // ─── Desktop panel helpers ────────────────────────────────────────────────
  const visiblePanels = [panels.code, panels.input, panels.output].filter(Boolean).length;

  const getDesktopStyle = (key: keyof PanelVisibility, fixedPx: number) => {
    if (!panels[key]) return { display: 'none' };
    if (visiblePanels === 1) return { flex: 1 };
    const isLast = (key === 'input' && !panels.output) || (key === 'code' && !panels.input && !panels.output);
    if (isLast) return { flex: 1, minWidth: MIN_PX };
    return { width: fixedPx, flexShrink: 0 };
  };

  const getOutputStyle = () => {
    if (!panels.output) return { display: 'none' };
    if (visiblePanels === 1) return { flex: 1 };
    return { flex: 1, minWidth: MIN_PX };
  };

  const liveResult: CompileResult | null = isCompiling && streamStdout
    ? { stdout: streamStdout, stderr: '', compileError: null, exitCode: 0, runtime: 0, timedOut: false }
    : output;

  // ─── Subtitle for code pane ───────────────────────────────────────────────
  const codeSubtitle = lang.label;

  return (
    <div
      className="flex flex-col bg-bg-base overflow-hidden"
      style={{ height: viewH }}
    >
      {/* Settings Panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={handleSettingsChange}
      />

      {/* Templates Panel */}
      <TemplatesPanel
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        langId={langId}
        onInsert={(tplCode) => setCode(tplCode)}
      />

      {/* Shortcuts Modal */}
      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        shortcuts={shortcuts}
        onChange={handleShortcutsChange}
      />

      {/* ── Shared view banner ──────────────────────────────────────────── */}
      {isSharedView && (
        <div className="flex items-center gap-2 px-3 py-1 bg-violet-950/60 border-b border-violet-800/40 text-violet-400 text-[11px] shrink-0 z-30">
          <Eye size={11} className="shrink-0" />
          <span>{el.sharedBanner} <a href="/" className="underline hover:text-violet-300">main page</a>.</span>
        </div>
      )}
      {/* ── MOBILE header — chỉ cần Logo + Lang + Optimize + Settings ── */}
      {isMobile ? (
        <header
          className="flex items-center gap-2 px-3 shrink-0 z-20 border-b"
          style={{ background: '#090912', borderColor: '#1a1a2c', minHeight: 48 }}
        >
          <div className="p-1 rounded" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <span className="text-indigo-400 text-sm leading-none">⚡</span>
          </div>
          <LanguageSelector value={langId} onChange={handleLangChange} />
          <div className="flex-1" />
          {/* Optimize toggle */}
          <button
            onClick={() => { setOptimize(v => { const next = !v; savePrefs({ ...loadPrefs(), optimize: next }); return next; }); }}
            title={optimize ? 'O2 — click to disable' : 'Fast (-O0) — click to enable O2'}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{
              width: 36, height: 36,
              background: optimize ? 'rgba(217,119,6,0.15)' : 'rgba(52,211,153,0.1)',
              color: optimize ? '#fbbf24' : '#34d399',
            }}
          >
            {optimize ? <Gauge size={16} /> : <Zap size={16} />}
          </button>
          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            title={el.editorSettings}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}
          >
            <Settings2 size={16} />
          </button>
        </header>
      ) : (
        /* ── DESKTOP header — đầy đủ ── */
        <header className="flex items-center justify-between px-3 py-1.5 bg-bg-header border-b border-border shrink-0 z-20 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1 rounded bg-indigo-600/20">
              <span className="text-indigo-400 text-sm">⚡</span>
            </div>
            <span className="text-sm font-bold text-gray-100 tracking-tight hidden sm:block">CodeEditor</span>
            <LanguageSelector value={langId} onChange={handleLangChange} />
          </div>
          <div className="flex items-center gap-1 flex-1 justify-center">
            <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-0.5">
              <button
                onClick={() => { setActiveTab('single'); savePrefs({ ...loadPrefs(), activeTab: 'single' }); }}
                className={`px-3 py-1 text-[11px] rounded-md transition-colors font-medium ${activeTab === 'single' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
                  }`}
              >{t.ui.singleRun}</button>
              <button
                onClick={() => { setActiveTab('testcases'); savePrefs({ ...loadPrefs(), activeTab: 'testcases' }); }}
                className={`px-3 py-1 text-[11px] rounded-md transition-colors font-medium flex items-center gap-1 ${activeTab === 'testcases' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                Test Cases
                <span className="text-[9px] bg-gray-600 text-gray-300 px-1 rounded font-mono">{testCases.length}</span>
              </button>
            </div>
          </div>
          <Header
            code={code} input={singleInput} output={output}
            isCompiling={isCompiling || isRunningAll}
            onRun={activeTab === 'testcases' ? handleRunAll : handleRun}
            onStop={handleStop}
            panels={panels} onTogglePanel={handleTogglePanel}
            optimize={optimize} onToggleOptimize={() => { setOptimize(v => { const next = !v; savePrefs({ ...loadPrefs(), optimize: next }); return next; }); }}
            isSharedView={isSharedView}
            langId={langId}
            inputHasContent={singleInput.trim().length > 0}
            minimal={true}
            onOpenSettings={() => setSettingsOpen(true)}
            testCases={testCases}
            extraFiles={extraFiles}
          />
          <LangSelect variant="compact" className="ml-1" />
        </header>
      )}

      {/* ══ MOBILE ════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <>
          {/* Main content area — switches by tab */}
          <div className="flex-1 overflow-hidden min-h-0 relative">

            {/* Code tab */}
            <div className={`absolute inset-0 ${mobileTab === 'code' ? 'flex flex-col' : 'hidden'}`}>
              <FileTabsBar
                mainFileName={mainFileName}
                extraFiles={extraFiles}
                activeFileId={activeFileId}
                onSelect={setActiveFileId}
                onAdd={handleAddFile}
                onDelete={handleDeleteFile}
                addLabel={el.addFile}
              />
              <CodeEditor
                value={editorValue}
                onChange={handleEditorChange}
                onRun={handleRun}
                language={editorLanguage}
                path={editorPath}
                diagnostics={activeFileId === 'main' ? diagnostics : []}
                settings={settings}
                shortcuts={shortcuts}
              />
            </div>

            {/* Input tab */}
            <div className={`absolute inset-0 flex flex-col ${mobileTab === 'input' ? 'flex' : 'hidden'}`}>
              <div className="pane-bar shrink-0">
                <div className="flex items-center gap-2">
                  <span className="dot dot-yellow" />
                  <span className="text-xs font-mono text-gray-400">stdin / input</span>
                </div>
                <div className="flex items-center gap-2">
                  <InteractiveModeToggle checked={interactiveMode} onChange={setInteractiveMode} label={el.interactiveToggle} />
                  <CopyButton text={singleInput} label="input" />
                </div>
              </div>
              {interactiveMode ? (
                <InteractiveModePlaceholder text={el.interactivePlaceholder} hint={el.interactiveHint} />
              ) : (
                <SingleInputEditor value={singleInput} onChange={setSingleInput} fontSize={settings.fontSize} />
              )}
            </div>

            {/* Tests tab */}
            <div className={`absolute inset-0 flex flex-col overflow-hidden ${mobileTab === 'tests' ? 'flex' : 'hidden'}`}>
              <TestCasePanel
                testCases={testCases}
                onUpdate={setTestCases}
                onRunAll={handleRunAll}
                onRunOne={handleRunOne}
                isRunningAll={isRunningAll}
                runningId={runningTcId}
              />
            </div>

            {/* Output tab */}
            <div className={`absolute inset-0 flex flex-col overflow-hidden ${mobileTab === 'output' ? 'flex' : 'hidden'}`}>
              <OutputPanel
                result={liveResult}
                isLoading={isCompiling && !streamStdout && !isActuallyRunning}
                onClear={() => { setOutput(null); setDiagnostics([]); }}
                showWarnings={settings.showWarnings}
                isRunning={isCompiling}
                onStdin={handleSendStdin}
                onEndStdin={handleEndStdin}
                onStop={handleStop}
              />
            </div>
          </div>

          {/* ── Bottom navigation bar ─────────────────────────────────────── */}
          {(() => {
            const isRunning = isCompiling || isRunningAll;
            const onRun = mobileTab === 'tests' ? handleRunAll : handleRun;

            // Output badge
            const outBadge = output
              ? output.compileError || output.exitCode !== 0 ? { text: '!', color: '#f87171' }
                : { text: '✓', color: '#4ade80' }
              : null;

            // Tests badge: show pass/fail count after run
            const ran = testCases.filter(t => t.status !== 'idle' && t.status !== 'running');
            const passed = ran.filter(t => t.status === 'ok').length;
            const failed = ran.filter(t => t.status === 'wrong' || t.status === 'error' || t.status === 'timeout').length;
            const testBadge = ran.length > 0
              ? failed > 0 ? { text: `${passed}/${testCases.length}`, color: '#f87171' }
                : { text: `${passed}/${testCases.length}`, color: '#4ade80' }
              : { text: String(testCases.length), color: '#6b7280' };

            const TABS = [
              { id: 'code', Icon: Code2, label: t.ui.tabs.code, badge: null, accentColor: '#4ade80' },
              { id: 'input', Icon: AlignLeft, label: t.ui.tabs.input, badge: singleInput.trim() ? { text: '·', color: '#facc15' } : null, accentColor: '#facc15' },
              { id: 'tests', Icon: ClipboardList, label: t.ui.tabs.tests, badge: testBadge, accentColor: '#818cf8' },
              { id: 'output', Icon: MonitorDot, label: t.ui.tabs.output, badge: outBadge, accentColor: '#f87171' },
            ] as const;

            return (
              <nav
                className="shrink-0 border-t flex items-stretch z-20"
                style={{
                  background: '#070710',
                  borderColor: '#14142a',
                  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                  minHeight: 58,
                }}
              >
                {/* 4 tabs */}
                {TABS.map(({ id, Icon, label, badge, accentColor }) => {
                  const active = mobileTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setMobileTab(id as typeof mobileTab)}
                      className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors"
                      style={{ color: active ? accentColor : '#374151' }}
                    >
                      {/* Active top bar */}
                      {active && (
                        <span
                          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                          style={{ width: 24, height: 2, background: accentColor }}
                        />
                      )}
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
                      <span className="text-[10px] font-medium leading-none">{label}</span>
                      {/* Badge */}
                      {badge && (
                        <span
                          className="absolute top-1.5 right-[calc(50%-22px)] text-[8px] font-bold px-1 py-px rounded-full leading-tight"
                          style={{ background: `${badge.color}22`, color: badge.color, border: `1px solid ${badge.color}44` }}
                        >
                          {badge.text}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Run button — lớn, nổi bật, biết đang ở tab nào */}
                <button
                  onClick={onRun}
                  disabled={isRunning}
                  className="flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40"
                  style={{
                    minWidth: 64,
                    background: isRunning ? '#1e1b4b' : mobileTab === 'tests' ? '#312e81' : '#1e1b4b',
                    borderLeft: '1px solid #14142a',
                    color: isRunning ? '#818cf8' : '#a5b4fc',
                  }}
                >
                  {isRunning
                    ? <Loader2 size={20} className="animate-spin" />
                    : <Play size={20} fill="currentColor" strokeWidth={0} />
                  }
                  <span className="text-[10px] font-semibold leading-none">
                    {mobileTab === 'tests' ? t.ui.runAll : t.ui.run}
                  </span>
                </button>
              </nav>
            );
          })()}
        </>
      ) : (
        /* ══ DESKTOP ══════════════════════════════════════════════════════ */
        <div ref={containerRef} className="flex flex-1 flex-row overflow-hidden">

          {/* Code pane */}
          {panels.code && (
            <div className="flex flex-col overflow-hidden" style={getDesktopStyle('code', codeW)}>
              <FileTabsBar
                mainFileName={mainFileName}
                extraFiles={extraFiles}
                activeFileId={activeFileId}
                onSelect={setActiveFileId}
                onAdd={handleAddFile}
                onDelete={handleDeleteFile}
                addLabel={el.addFile}
              />
              <PaneBar dotColor="dot-green" title={activeExtraFile ? activeExtraFile.name : mainFileName} subtitle={activeFileId === 'main' ? codeSubtitle : undefined}>
                <span className="text-[10px] text-gray-700 font-mono mr-1">
                  {editorValue.split('\n').length}L · {editorValue.length}C
                </span>
                <button
                  onClick={() => setTemplatesOpen(true)}
                  className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-indigo-400 transition-colors mr-0.5"
                  title={t.ui.templatesTitle}
                >
                  <LibrarySquare size={12} />
                </button>
                <button
                  onClick={() => setShortcutsOpen(true)}
                  className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors mr-0.5"
                  title={t.ui.shortcutsTitle}
                >
                  <Keyboard size={12} />
                </button>
                <CopyButton text={editorValue} label={activeExtraFile ? activeExtraFile.name : 'code'} />
              </PaneBar>
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={editorValue}
                  onChange={handleEditorChange}
                  onRun={handleRun}
                  language={editorLanguage}
                  path={editorPath}
                  diagnostics={activeFileId === 'main' ? diagnostics : []}
                  settings={settings}
                  shortcuts={shortcuts}
                />
              </div>
            </div>
          )}

          {panels.code && panels.input && (
            <ResizableDivider direction="horizontal" onDrag={handleDragCode} />
          )}

          {/* Input / Test cases pane */}
          {panels.input && (
            <div className="flex flex-col overflow-hidden" style={getDesktopStyle('input', inputW)}>
              {activeTab === 'single' ? (
                <>
                  <PaneBar dotColor="dot-yellow" title="input.txt" subtitle="stdin">
                    <InteractiveModeToggle checked={interactiveMode} onChange={setInteractiveMode} label={el.interactiveToggle} />
                    <CopyButton text={singleInput} label="input" />
                  </PaneBar>
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {interactiveMode ? (
                      <InteractiveModePlaceholder text={el.interactivePlaceholder} hint={el.interactiveHint} />
                    ) : (
                      <SingleInputEditor value={singleInput} onChange={setSingleInput} fontSize={settings.fontSize} />
                    )}
                  </div>
                </>
              ) : (
                <TestCasePanel
                  testCases={testCases}
                  onUpdate={setTestCases}
                  onRunAll={handleRunAll}
                  onRunOne={handleRunOne}
                  isRunningAll={isRunningAll}
                  runningId={runningTcId}
                />
              )}
            </div>
          )}

          {panels.input && panels.output && (
            <ResizableDivider direction="horizontal" onDrag={handleDragInput} />
          )}

          {/* Output pane */}
          {panels.output && (
            <div className="flex flex-col overflow-hidden" style={getOutputStyle()}>
              <OutputPanel
                result={liveResult}
                isLoading={isCompiling && !streamStdout && !isActuallyRunning}
                onClear={() => { setOutput(null); setDiagnostics([]); }}
                showWarnings={settings.showWarnings}
                isRunning={isCompiling}
                onStdin={handleSendStdin}
                onEndStdin={handleEndStdin}
                onStop={handleStop}
              />
            </div>
          )}

          {visiblePanels === 0 && (
            <div className="flex-1 flex items-center justify-center text-gray-700 text-sm">
              Tất cả panel đã bị ẩn. Bật lại từ thanh header.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single Input Editor ───────────────────────────────────────────────────
function SingleInputEditor({ value, onChange, fontSize = 13 }: {
  value: string;
  onChange: (v: string) => void;
  fontSize?: number;
}) {
  const { t } = useI18n();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.currentTarget;
    const start = ta.selectionStart, end = ta.selectionEnd;
    onChange(value.substring(0, start) + '  ' + value.substring(end));
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
  };
  return (
    <textarea
      ref={taRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={t.editorLayout.inputPlaceholder}
      spellCheck={false}
      autoComplete="off"
      style={{ fontSize: `${fontSize}px` }}
      className="code-textarea flex-1 h-full"
    />
  );
}

// ── PaneBar ───────────────────────────────────────────────────────────────
function PaneBar({ dotColor, title, subtitle, children }: {
  dotColor: string; title: string; subtitle?: string; children?: ReactNode;
}) {
  return (
    <div className="pane-bar">
      <div className="flex items-center gap-2">
        <span className={`dot ${dotColor}`} />
        <span className="text-xs font-mono text-gray-400">{title}</span>
        {subtitle && <span className="text-[10px] text-gray-600">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

// ── Interactive-mode toggle (compact switch for the Input pane header) ─────
function InteractiveModeToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      title={label}
      className={`flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
        checked ? 'bg-emerald-600/20 text-emerald-300' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
      }`}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span className={`relative w-6 h-3.5 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-600'}`}>
        <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-3' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

// ── Placeholder shown instead of the input textarea while interactive mode
// is on — input now happens live in the terminal (Output tab) as the
// program runs, so the pre-filled box would be unused/misleading here.
function InteractiveModePlaceholder({ text, hint }: { text: string; hint: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-600 p-6 text-center">
      <TerminalIcon size={26} className="opacity-40" />
      <p className="text-xs leading-relaxed max-w-[220px]">{text}</p>
      <p className="text-[10px] text-gray-700">{hint}</p>
    </div>
  );
}

// ── CopyButton ────────────────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      toast.success(`Copied ${label}!`);
      setTimeout(() => setDone(false), 2000);
    } catch { toast.error(t.ui.copy); }
  };
  return (
    <button onClick={handle}
      className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
      title={`Copy ${label}`}>
      {done ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  );
}

