'use client';

/**
 * components/EditorLayout.tsx
 *
 * Giao diện chính 3 pane có thể:
 *   - Resize bằng cách kéo divider (cả ngang lẫn dọc)
 *   - Bật/tắt từng pane qua nút toggle ở Header
 *   - Trên mobile: luôn stack dọc
 *   - Auto-save vào localStorage bằng fflate (debounce 800ms)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import Header, { type PanelVisibility } from './Header';
import CodeEditor from './CodeEditor';
import InputEditor from './InputEditor';
import OutputPanel, { type CompileResult } from './OutputPanel';
import ResizableDivider from './ResizableDivider';
import { debounce, AUTOSAVE_KEY, DEFAULT_CPP_CODE, DEFAULT_INPUT, clamp } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

// Kích thước tối thiểu (px) cho mỗi pane khi resize
const MIN_PX = 120;

interface EditorLayoutProps {
  initialCode?:   string;
  initialInput?:  string;
  isSharedView?:  boolean;
}

export default function EditorLayout({
  initialCode, initialInput, isSharedView = false,
}: EditorLayoutProps) {

  // ─── Editor content state ───
  const [code,  setCode]  = useState(initialCode  ?? DEFAULT_CPP_CODE);
  const [input, setInput] = useState(initialInput ?? DEFAULT_INPUT);
  const [output, setOutput] = useState<CompileResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [optimize, setOptimize] = useState(false);

  // ─── Panel visibility ───
  const [panels, setPanels] = useState<PanelVisibility>({
    code:   true,
    input:  true,
    output: true,
  });

  // ─── Panel sizes (px) – null = belum diinisialisasi ───
  // Lưu width cho layout ngang (desktop), height cho layout dọc (mobile)
  const containerRef = useRef<HTMLDivElement>(null);
  const [codeW,   setCodeW]   = useState(0); // px, sẽ được init khi container mount
  const [inputW,  setInputW]  = useState(0);
  // outputW = totalW - codeW - inputW - dividers
  const [isMobile, setIsMobile] = useState(false);

  // ─── Detect mobile (< 1024px) ───
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // ─── Khởi tạo kích thước panel khi container ready ───
  useEffect(() => {
    if (!containerRef.current) return;
    const total = containerRef.current.offsetWidth;
    // Chia đều 3 panel
    const third = Math.floor(total / 3);
    setCodeW(third);
    setInputW(third);
    // outputW tính ngầm = total - codeW - inputW - 8px (2 dividers)
  }, []);

  // ─── Toggle panel ───
  const handleTogglePanel = useCallback((key: keyof PanelVisibility) => {
    setPanels(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // Đảm bảo ít nhất 1 panel luôn hiển thị
      const anyVisible = Object.values(next).some(Boolean);
      if (!anyVisible) return prev;
      return next;
    });
  }, []);

  // ─── Resize handlers ───
  const handleDragCode = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const total = containerRef.current.offsetWidth;
    const maxW  = total - (panels.input ? MIN_PX : 0) - (panels.output ? MIN_PX : 0) - 8;
    setCodeW(prev => clamp(prev + delta, MIN_PX, maxW));
  }, [panels]);

  const handleDragInput = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const total  = containerRef.current.offsetWidth;
    const usedByCode = panels.code ? codeW : 0;
    const maxW   = total - usedByCode - (panels.output ? MIN_PX : 0) - 8;
    setInputW(prev => clamp(prev + delta, MIN_PX, maxW));
  }, [panels, codeW]);

  // ─── Auto-save debounced ───
  const autoSaveFn = useRef<ReturnType<typeof debounce> | null>(null);
  useEffect(() => {
    autoSaveFn.current = debounce(async (c: string, i: string) => {
      try {
        const { compressToBase64Url } = await import('@/lib/compress');
        const compressed = await compressToBase64Url(JSON.stringify({ code: c, input: i }));
        localStorage.setItem(AUTOSAVE_KEY, compressed);
      } catch (err) {
        console.warn('[AutoSave]', err);
      }
    }, 800) as any;
  }, []);

  useEffect(() => {
    if (!isReady) return;
    autoSaveFn.current?.(code, input);
  }, [code, input, isReady]);

  // ─── Load từ localStorage ───
  useEffect(() => {
    if (initialCode !== undefined || initialInput !== undefined) {
      setIsReady(true);
      return;
    }
    const load = async () => {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) { setIsReady(true); return; }
      try {
        const { decompressFromBase64Url } = await import('@/lib/compress');
        const parsed = JSON.parse(await decompressFromBase64Url(saved));
        if (parsed?.code  !== undefined) setCode(parsed.code);
        if (parsed?.input !== undefined) setInput(parsed.input);
      } catch {
        localStorage.removeItem(AUTOSAVE_KEY);
      } finally {
        setIsReady(true);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Compile & Run ───
  const handleRun = useCallback(async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setOutput(null);
    // Nếu output panel bị ẩn → tự động bật lại để xem kết quả
    setPanels(prev => ({ ...prev, output: true }));

    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, input, optimize }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        toast.error(e.error || 'Compile request thất bại');
        return;
      }
      const result: CompileResult = await res.json();
      setOutput(result);
      if (result.timedOut)           toast.warning('⏱ Timeout! Chương trình chạy quá 10s.');
      else if (result.compileError)  toast.error('❌ Compile error! Xem tab Errors.');
      else if (result.exitCode !== 0) toast.warning(`⚠️ Exit code ${result.exitCode}`);
      else                            toast.success(`✅ OK · ${result.runtime}ms`);
    } catch {
      toast.error('Không thể kết nối server. Docker đang chạy không?');
    } finally {
      setIsCompiling(false);
    }
  }, [code, input, isCompiling]);

  // ─── Keyboard shortcut ───
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault(); handleRun();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handleRun]);

  // ─── Tính toán flex style cho mỗi panel ───
  const visiblePanels = [panels.code, panels.input, panels.output].filter(Boolean).length;

  // Desktop horizontal layout
  const getDesktopStyle = (panelKey: keyof PanelVisibility, fixedPx: number) => {
    if (!panels[panelKey]) return { display: 'none' };
    // Nếu chỉ còn 1 panel → chiếm hết
    if (visiblePanels === 1) return { flex: 1 };
    // Nếu panel này là panel cuối cùng hiển thị (output đã ẩn, input là cuối)
    // thì dùng flex:1 để fill hết khoảng trống còn lại
    const isLastVisible =
      (panelKey === 'input' && !panels.output) ||
      (panelKey === 'code'  && !panels.input && !panels.output);
    if (isLastVisible) return { flex: 1, minWidth: MIN_PX };
    return { width: fixedPx, flexShrink: 0 };
  };

  // Output width = container - code - input - dividers
  const getOutputStyle = () => {
    if (!panels.output) return { display: 'none' };
    if (visiblePanels === 1) return { flex: 1 };
    // Output nhận phần còn lại
    return { flex: 1, minWidth: MIN_PX };
  };

  return (
    <div className="flex flex-col h-screen bg-bg-base overflow-hidden">
      <Header
        code={code} input={input} output={output}
        isCompiling={isCompiling} onRun={handleRun}
        panels={panels} onTogglePanel={handleTogglePanel}
        optimize={optimize} onToggleOptimize={() => setOptimize(v => !v)}
        isSharedView={isSharedView}
      />

      {/* ─── 3-pane body ─── */}
      <div
        ref={containerRef}
        className={`flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}
      >

        {/* ══ PANE 1: Code Editor ══ */}
        {panels.code && (
          <div
            className="flex flex-col overflow-hidden"
            style={isMobile
              ? (visiblePanels === 1
                  ? { flex: 1 }
                  : { height: '45%', flexShrink: 0 })
              : getDesktopStyle('code', codeW)
            }
          >
            <PaneBar dotColor="dot-green" title="main.cpp" subtitle="C++20">
              <CopyButton text={code} label="code"/>
            </PaneBar>
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                value={code}
                onChange={(v) => setCode(v ?? '')}
                onRun={handleRun}
              />
            </div>
          </div>
        )}

        {/* Divider Code | Input */}
        {panels.code && panels.input && !isMobile && (
          <ResizableDivider direction="horizontal" onDrag={handleDragCode}/>
        )}
        {panels.code && panels.input && isMobile && (
          <ResizableDivider direction="vertical" onDrag={() => {}}/>
        )}

        {/* ══ PANE 2: Input Editor ══ */}
        {panels.input && (
          <div
            className="flex flex-col overflow-hidden"
            style={isMobile
              ? (visiblePanels === 1 || !panels.output
                  ? { flex: 1, minHeight: MIN_PX }
                  : { height: '20%', flexShrink: 0 })
              : getDesktopStyle('input', inputW)
            }
          >
            <PaneBar dotColor="dot-yellow" title="input.txt" subtitle="stdin">
              <CopyButton text={input} label="input"/>
            </PaneBar>
            <div className="flex-1 overflow-hidden">
              <InputEditor value={input} onChange={setInput}/>
            </div>
          </div>
        )}

        {/* Divider Input | Output */}
        {panels.input && panels.output && !isMobile && (
          <ResizableDivider direction="horizontal" onDrag={handleDragInput}/>
        )}
        {panels.input && panels.output && isMobile && (
          <ResizableDivider direction="vertical" onDrag={() => {}}/>
        )}

        {/* ══ PANE 3: Output Panel ══ */}
        {panels.output && (
          <div
            className="flex flex-col overflow-hidden"
            style={isMobile
              ? { flex: 1 }
              : getOutputStyle()
            }
          >
            <OutputPanel
              result={output}
              isLoading={isCompiling}
              onClear={() => setOutput(null)}
            />
          </div>
        )}

        {/* Không có panel nào – thông báo */}
        {visiblePanels === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-700 text-sm">
            Tất cả panel đã bị ẩn. Bật lại từ thanh header.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tiêu đề pane nhỏ (macOS dots style) ──
function PaneBar({
  dotColor, title, subtitle, children,
}: {
  dotColor: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pane-bar">
      <div className="flex items-center gap-2">
        <span className={`dot ${dotColor}`}/>
        <span className="text-xs font-mono text-gray-400">{title}</span>
        {subtitle && <span className="text-[10px] text-gray-700">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

// ── Nút copy nhỏ cho từng pane ──
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
    <button
      onClick={handle}
      className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
      title={`Copy ${label}`}
    >
      {done ? <Check size={11} className="text-green-400"/> : <Copy size={11}/>}
    </button>
  );
}
