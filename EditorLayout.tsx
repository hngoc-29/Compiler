'use client';

/**
 * components/EditorLayout.tsx  v4
 *
 * Thay đổi so với v3:
 *   - Socket.IO thay HTTP POST → streaming stdout/stderr realtime
 *   - Mobile: Input là bottom-sheet riêng (InputDrawer)
 *   - Mobile: Output là collapsible drawer (OutputDrawer), mặc định đóng
 *   - Fix màu đen sau khi bàn phím ảo tắt (visualViewport)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { io as ioConnect, type Socket } from 'socket.io-client';

import Header, { type PanelVisibility } from './Header';
import CodeEditor       from './CodeEditor';
import InputEditor      from './InputEditor';
import InputDrawer      from './InputDrawer';
import OutputDrawer     from './OutputDrawer';
import OutputPanel, { type CompileResult } from './OutputPanel';
import ResizableDivider from './ResizableDivider';

import {
  debounce, AUTOSAVE_KEY, DEFAULT_CPP_CODE, DEFAULT_INPUT, clamp,
} from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

const MIN_PX = 120;

interface EditorLayoutProps {
  initialCode?:  string;
  initialInput?: string;
  isSharedView?: boolean;
}

export default function EditorLayout({
  initialCode, initialInput, isSharedView = false,
}: EditorLayoutProps) {

  // ─── Content ──────────────────────────────────────────────────────────────
  const [code,  setCode]  = useState(initialCode  ?? DEFAULT_CPP_CODE);
  const [input, setInput] = useState(initialInput ?? DEFAULT_INPUT);
  const [output, setOutput]       = useState<CompileResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isReady,  setIsReady]  = useState(false);
  const [optimize, setOptimize] = useState(false);

  // Chunks streaming stdout (hiển thị realtime trước khi compile:done)
  const [streamStdout, setStreamStdout] = useState('');

  // ─── Panel visibility (desktop) ───────────────────────────────────────────
  const [panels, setPanels] = useState<PanelVisibility>({
    code: true, input: true, output: true,
  });

  // ─── Mobile state ─────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  const [inputDrawerOpen, setInputDrawerOpen] = useState(false);

  // ─── Desktop resize ───────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [codeW,  setCodeW]  = useState(0);
  const [inputW, setInputW] = useState(0);

  // ─── Viewport height (keyboard-safe) ──────────────────────────────────────
  // viewH = vv.height → outer container co/restore theo bàn phím ảo.
  // CodeEditor KHÔNG cần set height thủ công — flexbox tự fill.
  const [viewH, setViewH] = useState<string>('100dvh');

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let rafId = 0;

    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setViewH(`${Math.round(vv.height)}px`);
      });
    };

    // Fallback khi bàn phím đóng: một số browser không fire vv.resize
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

  // ─── Detect mobile ────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // ─── Init desktop sizes ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const t = containerRef.current.offsetWidth;
    setCodeW(Math.floor(t / 3));
    setInputW(Math.floor(t / 3));
  }, []);

  // ─── Toggle panel ─────────────────────────────────────────────────────────
  const handleTogglePanel = useCallback((key: keyof PanelVisibility) => {
    setPanels(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  }, []);

  // ─── Desktop drag resize ──────────────────────────────────────────────────
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
    autoSaveFn.current = debounce(async (c: string, i: string) => {
      try {
        const { compressToBase64Url } = await import('@/lib/compress');
        const compressed = await compressToBase64Url(JSON.stringify({ code: c, input: i }));
        localStorage.setItem(AUTOSAVE_KEY, compressed);
      } catch (err) { console.warn('[AutoSave]', err); }
    }, 800) as unknown as ReturnType<typeof debounce>;
  }, []);

  useEffect(() => {
    if (!isReady) return;
    autoSaveFn.current?.(code, input);
  }, [code, input, isReady]);

  // ─── Load localStorage ────────────────────────────────────────────────────
  useEffect(() => {
    if (initialCode !== undefined || initialInput !== undefined) {
      setIsReady(true); return;
    }
    (async () => {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) { setIsReady(true); return; }
      try {
        const { decompressFromBase64Url } = await import('@/lib/compress');
        const parsed = JSON.parse(await decompressFromBase64Url(saved));
        if (parsed?.code  !== undefined) setCode(parsed.code);
        if (parsed?.input !== undefined) setInput(parsed.input);
      } catch { localStorage.removeItem(AUTOSAVE_KEY); }
      finally  { setIsReady(true); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Run (Socket.IO với HTTP fallback) ────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setOutput(null);
    setStreamStdout('');
    setPanels(prev => ({ ...prev, output: true })); // desktop: bật output pane

    const socket = socketRef.current;

    // ── Socket path ──────────────────────────────────────────────────────────
    if (socket?.connected) {
      let buf = '';

      const onStatus = (s: string) => {
        if (s === 'compiling') toast.info('⚙ Đang compile…', { id: 'run', duration: 15000 });
        if (s === 'running')   toast.info('▶ Đang chạy…',   { id: 'run', duration: 15000 });
      };
      const onStdout = (chunk: string) => { buf += chunk; setStreamStdout(buf); };
      const onStderr = (_: string) => {};
      const onDone   = (result: CompileResult) => {
        toast.dismiss('run');
        setOutput(result);
        setStreamStdout('');
        setIsCompiling(false);
        if (result.timedOut)            toast.warning('⏱ Timeout!');
        else if (result.compileError)   toast.error('❌ Compile error!');
        else if (result.exitCode !== 0) toast.warning(`⚠️ Exit ${result.exitCode}`);
        else                            toast.success(`✅ OK · ${result.runtime}ms`);
        off();
      };
      const onErr = (e: { message?: string }) => {
        toast.error(e?.message || 'Lỗi compile');
        setIsCompiling(false);
        off();
      };
      const off = () => {
        socket.off('compile:status',  onStatus);
        socket.off('compile:stdout',  onStdout);
        socket.off('compile:stderr',  onStderr);
        socket.off('compile:done',    onDone);
        socket.off('compile:error',   onErr);
      };

      socket.on('compile:status',  onStatus);
      socket.on('compile:stdout',  onStdout);
      socket.on('compile:stderr',  onStderr);
      socket.on('compile:done',    onDone);
      socket.on('compile:error',   onErr);

      socket.emit('compile', { code, input, optimize });
      return;
    }

    // ── HTTP fallback ────────────────────────────────────────────────────────
    try {
      const res = await fetch('/api/compile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code, input, optimize }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        toast.error(e.error || 'Compile thất bại');
        return;
      }
      const result: CompileResult = await res.json();
      setOutput(result);
      if (result.timedOut)            toast.warning('⏱ Timeout!');
      else if (result.compileError)   toast.error('❌ Compile error!');
      else if (result.exitCode !== 0) toast.warning(`⚠️ Exit ${result.exitCode}`);
      else                            toast.success(`✅ OK · ${result.runtime}ms`);
    } catch {
      toast.error('Không thể kết nối server.');
    } finally {
      setIsCompiling(false);
    }
  }, [code, input, isCompiling, optimize]);

  // ─── Ctrl+Enter ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault(); handleRun();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handleRun]);

  // ─── Desktop panel style helpers ──────────────────────────────────────────
  const visiblePanels = [panels.code, panels.input, panels.output].filter(Boolean).length;

  const getDesktopStyle = (key: keyof PanelVisibility, fixedPx: number) => {
    if (!panels[key]) return { display: 'none' };
    if (visiblePanels === 1) return { flex: 1 };
    const isLast =
      (key === 'input' && !panels.output) ||
      (key === 'code'  && !panels.input && !panels.output);
    if (isLast) return { flex: 1, minWidth: MIN_PX };
    return { width: fixedPx, flexShrink: 0 };
  };

  const getOutputStyle = () => {
    if (!panels.output) return { display: 'none' };
    if (visiblePanels === 1) return { flex: 1 };
    return { flex: 1, minWidth: MIN_PX };
  };

  // Live result cho desktop streaming (hiển thị stdout ngay khi đến)
  const liveResult: CompileResult | null = isCompiling && streamStdout
    ? { stdout: streamStdout, stderr: '', compileError: null, exitCode: 0, runtime: 0, timedOut: false }
    : output;

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="flex flex-col bg-bg-base overflow-hidden"
      style={{ height: viewH }}
    >
      <Header
        code={code} input={input} output={output}
        isCompiling={isCompiling} onRun={handleRun}
        panels={panels} onTogglePanel={handleTogglePanel}
        optimize={optimize} onToggleOptimize={() => setOptimize(v => !v)}
        isSharedView={isSharedView}
        onOpenInput={isMobile ? () => setInputDrawerOpen(true) : undefined}
        inputHasContent={input.trim().length > 0}
      />

      {/* ══ MOBILE ════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <>
          <div className="flex-1 overflow-hidden min-h-0">
            <CodeEditor
              value={code}
              onChange={(v) => setCode(v ?? '')}
              onRun={handleRun}
            />
          </div>

          <OutputDrawer
            result={output}
            isLoading={isCompiling}
            onClear={() => setOutput(null)}
            streamChunks={isCompiling ? streamStdout : undefined}
          />

          <InputDrawer
            open={inputDrawerOpen}
            value={input}
            onChange={setInput}
            onClose={() => setInputDrawerOpen(false)}
          />
        </>
      ) : (
        /* ══ DESKTOP ══════════════════════════════════════════════════════ */
        <div ref={containerRef} className="flex flex-1 flex-row overflow-hidden">

          {panels.code && (
            <div className="flex flex-col overflow-hidden" style={getDesktopStyle('code', codeW)}>
              <PaneBar dotColor="dot-green" title="main.cpp" subtitle="C++20">
                <CopyButton text={code} label="code" />
              </PaneBar>
              <div className="flex-1 overflow-hidden">
                <CodeEditor value={code} onChange={(v) => setCode(v ?? '')} onRun={handleRun} />
              </div>
            </div>
          )}

          {panels.code && panels.input && (
            <ResizableDivider direction="horizontal" onDrag={handleDragCode} />
          )}

          {panels.input && (
            <div className="flex flex-col overflow-hidden" style={getDesktopStyle('input', inputW)}>
              <PaneBar dotColor="dot-yellow" title="input.txt" subtitle="stdin">
                <CopyButton text={input} label="input" />
              </PaneBar>
              <div className="flex-1 overflow-hidden">
                <InputEditor value={input} onChange={setInput} />
              </div>
            </div>
          )}

          {panels.input && panels.output && (
            <ResizableDivider direction="horizontal" onDrag={handleDragInput} />
          )}

          {panels.output && (
            <div className="flex flex-col overflow-hidden" style={getOutputStyle()}>
              <OutputPanel
                result={liveResult}
                isLoading={isCompiling && !streamStdout}
                onClear={() => setOutput(null)}
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

// ── PaneBar ──────────────────────────────────────────────────────────────────
function PaneBar({ dotColor, title, subtitle, children }: {
  dotColor: string; title: string; subtitle?: string; children?: React.ReactNode;
}) {
  return (
    <div className="pane-bar">
      <div className="flex items-center gap-2">
        <span className={`dot ${dotColor}`} />
        <span className="text-xs font-mono text-gray-400">{title}</span>
        {subtitle && <span className="text-[10px] text-gray-700">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

// ── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      toast.success(`Đã copy ${label}!`);
      setTimeout(() => setDone(false), 2000);
    } catch { toast.error('Không thể copy'); }
  };
  return (
    <button onClick={handle}
      className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
      title={`Copy ${label}`}>
      {done ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  );
}
