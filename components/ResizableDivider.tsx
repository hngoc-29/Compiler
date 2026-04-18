'use client';

/**
 * components/ResizableDivider.tsx
 *
 * Thanh kéo để resize 2 panel liền kề.
 * direction = 'horizontal' → kéo ngang (thay đổi width)
 * direction = 'vertical'   → kéo dọc (thay đổi height)
 *
 * Sử dụng:
 *   <ResizableDivider
 *     direction="horizontal"
 *     onDrag={(delta) => setSplitPx(prev => clamp(prev + delta, min, max))}
 *   />
 */

import { useCallback, useRef } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';

interface Props {
  direction: 'horizontal' | 'vertical';
  /** delta dương = panel trước to ra, delta âm = panel trước nhỏ lại */
  onDrag: (delta: number) => void;
  className?: string;
}

export default function ResizableDivider({ direction, onDrag, className = '' }: Props) {
  const isDragging = useRef(false);
  const lastPos    = useRef(0);
  const divRef     = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const pos   = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = pos - lastPos.current;
    lastPos.current = pos;
    if (delta !== 0) onDrag(delta);
  }, [direction, onDrag]);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    divRef.current?.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    lastPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    divRef.current?.classList.add('dragging');
    document.body.style.cursor    = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }, [direction, onMouseMove, onMouseUp]);

  // Touch support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDragging.current = true;
    lastPos.current = direction === 'horizontal' ? touch.clientX : touch.clientY;
  }, [direction]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const pos   = direction === 'horizontal' ? touch.clientX : touch.clientY;
    const delta = pos - lastPos.current;
    lastPos.current = pos;
    if (delta !== 0) onDrag(delta);
  }, [direction, onDrag]);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const isH = direction === 'horizontal';

  return (
    <div
      ref={divRef}
      className={`resize-handle ${isH ? 'resize-handle-h' : 'resize-handle-v'} group flex items-center justify-center ${className}`}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Grip icon – hiện khi hover */}
      <div className="opacity-0 group-hover:opacity-60 transition-opacity text-indigo-400">
        {isH
          ? <GripVertical   size={12} />
          : <GripHorizontal size={12} />
        }
      </div>
    </div>
  );
}
