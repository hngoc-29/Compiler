'use client';

/**
 * components/InputDrawer.tsx
 *
 * Mobile: bottom-sheet full-screen để nhập stdin.
 * Desktop: không dùng (EditorLayout render InputEditor trực tiếp).
 */

import { useRef, useEffect, useCallback } from 'react';
import { X, Copy, Trash2, GripHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface InputDrawerProps {
  open:     boolean;
  value:    string;
  onChange: (v: string) => void;
  onClose:  () => void;
}

export default function InputDrawer({ open, value, onChange, onClose }: InputDrawerProps) {
  const taRef        = useRef<HTMLTextAreaElement>(null);
  const backdropRef  = useRef<HTMLDivElement>(null);
  const sheetRef     = useRef<HTMLDivElement>(null);
  const startY       = useRef(0);
  const dragging     = useRef(false);
  const translateY   = useRef(0);

  // Focus textarea khi mở
  useEffect(() => {
    if (open) {
      setTimeout(() => taRef.current?.focus(), 150);
      // Reset transform khi mở
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
        sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32,0.72,0,1)';
      }
    }
  }, [open]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(value); toast.success('Đã copy input!'); }
    catch { toast.error('Không thể copy'); }
  };

  const handleClear = () => { onChange(''); taRef.current?.focus(); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta    = e.currentTarget;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    onChange(value.substring(0, start) + '  ' + value.substring(end));
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
  };

  // ── Drag-to-dismiss handle ────────────────────────────────────────────────
  const onHandleTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    startY.current   = e.touches[0].clientY;
    translateY.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, []);

  const onHandleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) return; // chỉ kéo xuống
    translateY.current = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
  }, []);

  const onHandleTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32,0.72,0,1)';
    }
    // Dismiss nếu kéo > 120px
    if (translateY.current > 120) {
      onClose();
    } else {
      if (sheetRef.current) sheetRef.current.style.transform = 'translateY(0)';
    }
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onPointerDown={(e) => {
        // Đóng khi chạm backdrop (ngoài sheet)
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-2xl overflow-hidden"
        style={{
          height: '88dvh',
          background: '#0e0e18',
          border: '1px solid #1f1f32',
          borderBottom: 'none',
        }}
      >
        {/* ── Drag handle ── */}
        <div
          className="flex-shrink-0 flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-gray-700 mb-2" />
        </div>

        {/* ── Toolbar ── */}
        <div className="pane-bar flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="dot dot-yellow" />
            <span className="text-xs font-mono text-gray-400">input.txt</span>
            {value.length > 0 && (
              <span className="text-[10px] text-gray-600">{value.length} ch</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleCopy}
              className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
              title="Copy">
              <Copy size={13} />
            </button>
            <button onClick={handleClear}
              className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
              title="Xóa">
              <Trash2 size={13} />
            </button>
            <button onClick={onClose}
              className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-200 transition-colors ml-1"
              title="Đóng">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Textarea ── */}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={"Nhập stdin ở đây...\n(nội dung sẽ truyền vào cin)"}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="code-textarea flex-1"
          style={{ borderRadius: 0 }}
        />
      </div>
    </div>
  );
}
