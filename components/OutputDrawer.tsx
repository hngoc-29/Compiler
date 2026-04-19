'use client';

/**
 * components/OutputDrawer.tsx
 *
 * Mobile-only: bottom drawer kéo lên/xuống để xem output.
 * - Mặc định đóng (chỉ hiện handle bar 44px)
 * - Tự động mở khi có kết quả / đang compile
 * - Kéo lên/xuống để resize, snap khi thả
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { GripHorizontal, ChevronUp, ChevronDown } from 'lucide-react';
import OutputPanel, { type CompileResult } from './OutputPanel';

const BAR_H   = 44;    // px – chiều cao thanh handle khi đóng
const SNAP_VH = 0.48;  // fraction viewport khi auto-open

interface OutputDrawerProps {
  result:    CompileResult | null;
  isLoading: boolean;
  onClear:   () => void;
  /** Chunks stdout streaming để hiển thị trước khi done */
  streamChunks?: string;
}

export default function OutputDrawer({
  result, isLoading, onClear, streamChunks,
}: OutputDrawerProps) {
  const [height, setHeight]   = useState(BAR_H);
  const [snapping, setSnapping] = useState(false); // animation đang chạy
  const dragging = useRef(false);
  const lastY    = useRef(0);
  const startH   = useRef(BAR_H);

  // ── Auto-open khi bắt đầu compile hoặc có kết quả ─────────────────────────
  useEffect(() => {
    if (isLoading || result) {
      setSnapping(true);
      setHeight(Math.floor(window.innerHeight * SNAP_VH));
      setTimeout(() => setSnapping(false), 300);
    }
  }, [isLoading, result]);

  const isOpen = height > BAR_H + 20;

  // ── Snap helper ────────────────────────────────────────────────────────────
  const snap = useCallback((h: number) => {
    const vh = window.innerHeight;
    setSnapping(true);
    if (h < BAR_H + 80)             setHeight(BAR_H);        // snap closed
    else if (h > vh * 0.8)          setHeight(vh - 56);      // snap full
    else                             setHeight(h);            // keep
    setTimeout(() => setSnapping(false), 300);
  }, []);

  // ── Touch drag ────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    lastY.current    = e.touches[0].clientY;
    startH.current   = height;
  }, [height]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    e.preventDefault(); // prevent scroll while dragging
    const dy = lastY.current - e.touches[0].clientY; // up = positive = bigger height
    lastY.current = e.touches[0].clientY;
    const vh = window.innerHeight;
    setHeight(prev => Math.max(BAR_H, Math.min(vh - 56, prev + dy)));
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setHeight(prev => {
      snap(prev);
      return prev;
    });
  }, [snap]);

  // ── Mouse drag (desktop fallback) ─────────────────────────────────────────
  const mouseHandlers = useRef<{ move: ((e: MouseEvent) => void) | null; up: (() => void) | null }>({ move: null, up: null });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    lastY.current    = e.clientY;

    mouseHandlers.current.move = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const dy = lastY.current - ev.clientY;
      lastY.current = ev.clientY;
      const vh = window.innerHeight;
      setHeight(prev => Math.max(BAR_H, Math.min(vh - 56, prev + dy)));
    };

    mouseHandlers.current.up = () => {
      dragging.current = false;
      setHeight(prev => { snap(prev); return prev; });
      document.removeEventListener('mousemove', mouseHandlers.current.move!);
      document.removeEventListener('mouseup',   mouseHandlers.current.up!);
    };

    document.addEventListener('mousemove', mouseHandlers.current.move);
    document.addEventListener('mouseup',   mouseHandlers.current.up);
  }, [snap]);

  // ── Toggle button ──────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    setSnapping(true);
    if (isOpen) {
      setHeight(BAR_H);
    } else {
      setHeight(Math.floor(window.innerHeight * SNAP_VH));
    }
    setTimeout(() => setSnapping(false), 300);
  }, [isOpen]);

  // Nếu có stream đang chạy, tạo CompileResult tạm để hiển thị
  const liveResult: CompileResult | null = isLoading && streamChunks !== undefined
    ? {
        stdout:       streamChunks,
        stderr:       '',
        compileError: null,
        exitCode:     0,
        runtime:      0,
        timedOut:     false,
      }
    : result;

  return (
    <div
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        height,
        transition: snapping ? 'height 0.28s cubic-bezier(0.32,0.72,0,1)' : 'none',
        borderTop:  '1px solid #1f1f32',
        background: '#0e0e18',
        willChange: 'height',
      }}
    >
      {/* ── Handle bar ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-3 select-none"
        style={{ height: BAR_H, cursor: 'row-resize', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Left: grip + label */}
        <div className="flex items-center gap-2 pointer-events-none">
          <GripHorizontal size={14} className="text-gray-600" />
          <span className="text-[11px] font-mono text-gray-500">console</span>
          {isLoading && (
            <span className="text-[10px] text-indigo-400 loading-pulse">running…</span>
          )}
          {!isLoading && result && !result.compileError && result.exitCode === 0 && (
            <span className="text-[10px] text-green-500">✓ {result.runtime}ms</span>
          )}
          {!isLoading && result && (result.compileError || result.exitCode !== 0) && (
            <span className="text-[10px] text-red-400">
              {result.compileError ? '✗ compile error' : `✗ exit ${result.exitCode}`}
            </span>
          )}
        </div>

        {/* Right: toggle chevron (tap only, no drag) */}
        <button
          onPointerDown={(e) => e.stopPropagation()} // không trigger drag
          onClick={toggle}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-600 hover:text-gray-400 transition-colors"
        >
          {isOpen
            ? <ChevronDown size={14} />
            : <ChevronUp   size={14} />
          }
        </button>
      </div>

      {/* ── Panel content ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="flex-1 overflow-hidden">
          <OutputPanel
            result={liveResult}
            isLoading={isLoading && !streamChunks}
            onClear={onClear}
          />
        </div>
      )}
    </div>
  );
}
