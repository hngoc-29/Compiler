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

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { io as ioConnect, type Socket } from 'socket.io-client';

import Header, { type PanelVisibility } from './Header';
import CodeEditor       from './CodeEditor';
import InputDrawer      from './InputDrawer';
import OutputDrawer     from './OutputDrawer';
import OutputPanel, { type CompileResult } from './OutputPanel';
import ResizableDivider from './ResizableDivider';
import TestCasePanel    from './TestCasePanel';
import LanguageSelector from './LanguageSelector';
import TemplatesPanel  from './TemplatesPanel';
import ShortcutsModal  from './ShortcutsModal';
import SettingsPanel    from './SettingsPanel';

import { addToHistory } from '@/lib/run-history';

import {
  debounce, AUTOSAVE_KEY, clamp,
} from '@/lib/utils';
import { getLangById, DEFAULT_LANG_ID } from '@/lib/languages';
import { DEFAULT_TEST_CASES, type TestCase, type SavedTestCase, createTestCase, compareOutput, serializeTestCases, deserializeTestCases } from '@/lib/testcases';
import { parseGppDiagnostics, type Diagnostic } from '@/lib/cpp-suggestions';
import { loadSettings, saveSettings, type EditorSettings } from '@/lib/editor-settings';
import { loadPrefs,   savePrefs                            } from '@/lib/user-prefs';
import { Copy, Check, Loader2, Code2, AlignLeft, ClipboardList, MonitorDot, Play, Zap, Gauge, Settings2, Eye, LibrarySquare, Keyboard } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { SUPPORTED_LANGS, LANG_NAMES } from '@/lib/i18n';

const MIN_PX = 120;

interface EditorLayoutProps {
  initialCode?:       string;
  initialInput?:      string;
  initialTestCases?:  SavedTestCase[];
  isSharedView?: boolean;
}

export default function EditorLayout({
  initialCode, initialInput, initialTestCases, isSharedView = false,
}: EditorLayoutProps) {

  const { t } = useI18n();
  const el = t.editorLayout;

  // ─── User preferences (lang, optimize, panels, activeTab) ──────────────────
  // Loaded once at mount; individual state setters persist on every change.
  const _prefs = useState(loadPrefs)[0];

  // ─── Language ────────────────────────────────────────────────────────────
  const [langId,   setLangId]   = useState(_prefs.langId);
  const lang = getLangById(langId);

  // ─── Content ─────────────────────────────────────────────────────────────
  const [code,  setCode]  = useState(initialCode  ?? lang.hello);
  const [output, setOutput]       = useState<CompileResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isReady,  setIsReady]  = useState(false);
  const [optimize, setOptimize] = useState(_prefs.optimize);
  const [streamStdout, setStreamStdout] = useState('');

  // ─── Diagnostics (from last compile error → Monaco markers) ──────────────
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  // ─── Editor Settings ─────────────────────────────────────────────────────
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const handleSettingsChange = (s: EditorSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  // ─── Test cases ──────────────────────────────────────────────────────────
  const [testCases, setTestCases]     = useState<TestCase[]>(
    initialTestCases ? deserializeTestCases(initialTestCases) : DEFAULT_TEST_CASES
  );
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningTcId, setRunningTcId]   = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<'single' | 'testcases'>(_prefs.activeTab);

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
  const [codeW,  setCodeW]  = useState(0);
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
    const maxW  = total - (panels.input ? MIN_PX : 0) - (panels.output ? MIN_PX : 0) - 8;
    setCodeW(prev => clamp(prev + delta, MIN_PX, maxW));
  }, [panels]);

  const handleDragInput = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const total      = containerRef.current.offsetWidth;
    const usedByCode = panels.code ? codeW : 0;
    const maxW       = total - usedByCode - (panels.output ? MIN_PX : 0) - 8;
    setInputW(prev => clamp(prev + delta, MIN_PX, maxW));
  }, [panels, codeW]);

  // ─── Auto-save ────────────────────────────────────────────────────────────
  const autoSaveFn = useRef<ReturnType<typeof debounce> | null>(null);
  useEffect(() => {
    autoSaveFn.current = debounce(async (c: string, tcs: TestCase[]) => {
      try {
        const { compressToBase64Url } = await import('@/lib/compress');
        const payload = JSON.stringify({
          code: c,
          input: tcs[0]?.input ?? '',          // keep for backwards compat
          testCases: serializeTestCases(tcs),
        });
        const compressed = await compressToBase64Url(payload);
        localStorage.setItem(AUTOSAVE_KEY, compressed);
      } catch (err) { console.warn('[AutoSave]', err); }
    }, 800) as unknown as ReturnType<typeof debounce>;
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (isSharedView) return; // Don't overwrite own code when viewing a shared link
    autoSaveFn.current?.(code, testCases);
  }, [code, testCases, isReady, isSharedView]);

  useEffect(() => {
    if (initialCode !== undefined || initialInput !== undefined || initialTestCases !== undefined) {
      // Shared view: initialTestCases already applied via useState initialiser.
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
      } catch { localStorage.removeItem(AUTOSAVE_KEY); }
      finally  { setIsReady(true); }
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

  // ─── Socket.IO ────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = ioConnect({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  // ─── Core: chạy code 1 lần, trả về Promise<CompileResult> ──────────────────
  // Ưu tiên WebSocket (nhanh hơn, streaming), fallback sang HTTP.
  // Không cache — mỗi lần chạy là chạy mới với đúng input của nó.
  const runOnce = useCallback((
    codeToRun: string,
    inputToRun: string,
    onStdoutChunk?: (chunk: string) => void,
  ): Promise<CompileResult> => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;

      if (socket?.connected) {
        const onStdout = (chunk: string) => onStdoutChunk?.(chunk);
        const onDone   = (result: CompileResult) => { off(); resolve(result); };
        const onErr    = (e: { message?: string }) => {
          off();
          reject(new Error(e?.message || 'Socket error'));
        };
        const off = () => {
          socket.off('compile:stdout', onStdout);
          socket.off('compile:done',   onDone);
          socket.off('compile:error',  onErr);
        };
        socket.on('compile:stdout', onStdout);
        socket.on('compile:done',   onDone);
        socket.on('compile:error',  onErr);
        socket.emit('compile', { code: codeToRun, input: inputToRun, optimize, langId, timeoutMs: settings.runTimeoutMs });
      } else {
        // HTTP fallback
        fetch('/api/compile', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ code: codeToRun, input: inputToRun, optimize, langId, timeoutMs: settings.runTimeoutMs }),
        })
          .then(res => res.ok
            ? res.json()
            : res.json().then((e: { error?: string }) => Promise.reject(new Error(e.error || `HTTP ${res.status}`)))
          )
          .then(resolve)
          .catch(reject);
      }
    });
  }, [optimize, langId]);

  // ─── Run single (main input) ──────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setOutput(null);
    setStreamStdout('');
    setDiagnostics([]);
    setPanels(prev => ({ ...prev, output: true }));
    toast.info(el.compilingToast, { id: 'run', duration: 15000 });

    let buf = '';
    try {
      const result = await runOnce(code, singleInput, (chunk) => {
        buf += chunk;
        setStreamStdout(buf);
      });

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
        if (result.timedOut)            toast.warning(el.timeoutWarning);
        else if (result.exitCode !== 0) toast.warning(`⚠️ Exit ${result.exitCode}`);
        else                            toast.success(`✅ OK · ${result.runtime}ms`);
      }
    } catch (err) {
      toast.dismiss('run');
      toast.error(err instanceof Error ? err.message : el.cannotConnect);
    } finally {
      setIsCompiling(false);
    }
  }, [code, singleInput, isCompiling, isMobile, runOnce]);

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
      if (result.compileError)        status = 'error';
      else if (result.timedOut)       status = 'timeout';
      else if (result.exitCode !== 0) status = 'error';
      else if (hasExpected && !compareOutput(result.stdout, tc.expectedOutput)) status = 'wrong';
      else                            status = 'ok';

      setTestCases(prev => prev.map(t => t.id === tc.id ? {
        ...t, status,
        output:  result.compileError ? null : result.stdout,
        error:   result.compileError ?? (result.stderr || null),
        runtime: result.runtime,
      } : t));

      if (status === 'error')        toast.error(`❌ ${tc.label}: ${result.compileError ? 'Compile error' : `Exit ${result.exitCode}`}`);
      else if (status === 'timeout') toast.warning(`⏱ ${tc.label}: Timeout`);
      else if (status === 'wrong')   toast.error(`❌ ${tc.label}: Wrong Answer`);
      else toast.success(`✅ ${tc.label}: ${hasExpected ? 'PASS' : `OK · ${result.runtime}ms`}`);
    } catch (err) {
      setTestCases(prev => prev.map(t => t.id === tc.id
        ? { ...t, status: 'error', error: err instanceof Error ? err.message : 'Network error' }
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
          const tc   = snapshot[data.index];
          const next = snapshot[data.index + 1];
          if (!tc) return;

          // Đánh dấu test tiếp theo là đang chạy (real-time feedback)
          if (next)
            setTestCases(prev => prev.map(t =>
              t.id === next.id ? { ...t, status: 'running' } : t));

          const hasExpected = tc.expectedOutput?.trim().length > 0;
          let status: TestCase['status'];
          if      (data.timedOut)                                              status = 'timeout';
          else if (data.exitCode !== 0)                                        status = 'error';
          else if (hasExpected && !compareOutput(data.stdout, tc.expectedOutput)) status = 'wrong';
          else                                                                 status = 'ok';

          if      (status === 'ok')    passCount++;
          else if (status === 'wrong') failCount++;
          else                         errCount++;

          setTestCases(prev => prev.map(t => t.id === tc.id ? {
            ...t, status,
            output:  data.stdout,
            error:   data.stderr || null,
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
          socket.off('compile:batch:status',  onStatus);
          socket.off('compile:batch:error',   onCompileError);
          socket.off('compile:batch:result',  onResult);
          socket.off('compile:batch:done',    onDone);
          socket.off('compile:error',         onErr);
        };

        socket.on('compile:batch:status', onStatus);
        socket.on('compile:batch:error',  onCompileError);
        socket.on('compile:batch:result', onResult);
        socket.on('compile:batch:done',   onDone);
        socket.on('compile:error',        onErr);

        socket.emit('compile:batch', {
          code,
          inputs:   snapshot.map(tc => tc.input),
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
          if      (result.timedOut)                                                  status = 'timeout';
          else if (result.exitCode !== 0)                                            status = 'error';
          else if (hasExpected && !compareOutput(result.stdout, tc.expectedOutput))  status = 'wrong';
          else                                                                        status = 'ok';

          if      (status === 'ok')    passCount++;
          else if (status === 'wrong') failCount++;
          else                         errCount++;

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

  // ─── Ctrl+Enter ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
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
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handleRun, handleRunAll, activeTab]);

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
            {optimize ? <Gauge size={16}/> : <Zap size={16}/>}
          </button>
          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            title={el.editorSettings}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}
          >
            <Settings2 size={16}/>
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
                className={`px-3 py-1 text-[11px] rounded-md transition-colors font-medium ${
                  activeTab === 'single' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
                }`}
              >Single Run</button>
              <button
                onClick={() => { setActiveTab('testcases'); savePrefs({ ...loadPrefs(), activeTab: 'testcases' }); }}
                className={`px-3 py-1 text-[11px] rounded-md transition-colors font-medium flex items-center gap-1 ${
                  activeTab === 'testcases' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
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
            panels={panels} onTogglePanel={handleTogglePanel}
            optimize={optimize} onToggleOptimize={() => { setOptimize(v => { const next = !v; savePrefs({ ...loadPrefs(), optimize: next }); return next; }); }}
            isSharedView={isSharedView}
            langId={langId}
            inputHasContent={singleInput.trim().length > 0}
            minimal={true}
            onOpenSettings={() => setSettingsOpen(true)}
            testCases={testCases}
          />
          <LangToggle />
        </header>
      )}

      {/* ══ MOBILE ════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <>
          {/* Main content area — switches by tab */}
          <div className="flex-1 overflow-hidden min-h-0 relative">

            {/* Code tab */}
            <div className={`absolute inset-0 ${mobileTab === 'code' ? 'flex flex-col' : 'hidden'}`}>
              <CodeEditor
                value={code}
                onChange={(v) => setCode(v ?? '')}
                onRun={handleRun}
                language={lang.monacoLang}
                diagnostics={diagnostics}
                settings={settings}
              />
            </div>

            {/* Input tab */}
            <div className={`absolute inset-0 flex flex-col ${mobileTab === 'input' ? 'flex' : 'hidden'}`}>
              <div className="pane-bar shrink-0">
                <div className="flex items-center gap-2">
                  <span className="dot dot-yellow" />
                  <span className="text-xs font-mono text-gray-400">stdin / input</span>
                </div>
                <CopyButton text={singleInput} label="input" />
              </div>
              <SingleInputEditor value={singleInput} onChange={setSingleInput} fontSize={settings.fontSize} />
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
                isLoading={isCompiling && !streamStdout}
                onClear={() => { setOutput(null); setDiagnostics([]); }}
                showWarnings={settings.showWarnings}
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
              { id: 'code',   Icon: Code2,          label: 'Code',   badge: null,       accentColor: '#4ade80' },
              { id: 'input',  Icon: AlignLeft,       label: 'Input',  badge: singleInput.trim() ? { text: '·', color: '#facc15' } : null, accentColor: '#facc15' },
              { id: 'tests',  Icon: ClipboardList,   label: 'Tests',  badge: testBadge,  accentColor: '#818cf8' },
              { id: 'output', Icon: MonitorDot,      label: 'Output', badge: outBadge,   accentColor: '#f87171' },
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
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.6}/>
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
                    ? <Loader2 size={20} className="animate-spin"/>
                    : <Play size={20} fill="currentColor" strokeWidth={0}/>
                  }
                  <span className="text-[10px] font-semibold leading-none">
                    {mobileTab === 'tests' ? 'All' : 'Run'}
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
              <PaneBar dotColor="dot-green" title={lang.ext === 'py' ? 'main.py' : lang.ext === 'c' ? 'main.c' : 'main.cpp'} subtitle={codeSubtitle}>
                <span className="text-[10px] text-gray-700 font-mono mr-1">
                  {code.split('\n').length}L · {code.length}C
                </span>
                <button
                  onClick={() => setTemplatesOpen(true)}
                  className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-indigo-400 transition-colors mr-0.5"
                  title="Templates CP (Ctrl+T)"
                >
                  <LibrarySquare size={12}/>
                </button>
                <button
                  onClick={() => setShortcutsOpen(true)}
                  className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors mr-0.5"
                  title="Keyboard shortcuts (?)"
                >
                  <Keyboard size={12}/>
                </button>
                <CopyButton text={code} label="code" />
              </PaneBar>
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={code}
                  onChange={(v) => setCode(v ?? '')}
                  onRun={handleRun}
                  language={lang.monacoLang}
                  diagnostics={diagnostics}
                  settings={settings}
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
                    <CopyButton text={singleInput} label="input" />
                  </PaneBar>
                  <div className="flex-1 overflow-hidden">
                    <SingleInputEditor value={singleInput} onChange={setSingleInput} fontSize={settings.fontSize} />
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
                isLoading={isCompiling && !streamStdout}
                onClear={() => { setOutput(null); setDiagnostics([]); }}
                showWarnings={settings.showWarnings}
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
  dotColor: string; title: string; subtitle?: string; children?: React.ReactNode;
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

// ── CopyButton ────────────────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      toast.success(`Copied ${label}!`);
      setTimeout(() => setDone(false), 2000);
    } catch { toast.error('Cannot copy'); }
  };
  return (
    <button onClick={handle}
      className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
      title={`Copy ${label}`}>
      {done ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  );
}

// ── LangToggle ────────────────────────────────────────────────────────────
// Reads SUPPORTED_LANGS dynamically — new languages appear automatically.
function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-0.5 ml-1">
      {SUPPORTED_LANGS.map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 text-[10px] rounded font-mono transition-colors ${
            lang === l
              ? 'bg-indigo-600/70 text-indigo-200 font-semibold'
              : 'text-gray-600 hover:text-gray-400'
          }`}
          title={LANG_NAMES[l]}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
