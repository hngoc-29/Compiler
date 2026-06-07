'use client';

/**
 * components/ShortcutsModal.tsx
 * Modal hiển thị tất cả phím tắt — mở bằng phím ? hoặc nút Help.
 */

import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  open:    boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Chạy code',
    items: [
      { keys: ['Ctrl', 'Enter'],         desc: 'Compile & Run (hoặc Run All nếu đang ở tab Test Cases)' },
      { keys: ['Ctrl', 'Shift', 'F'],    desc: 'Format code (đẹp code tự động)' },
    ],
  },
  {
    title: 'Editor',
    items: [
      { keys: ['Ctrl', 'Z'],             desc: 'Undo' },
      { keys: ['Ctrl', 'Y'],             desc: 'Redo' },
      { keys: ['Ctrl', 'D'],             desc: 'Duplicate dòng hiện tại' },
      { keys: ['Ctrl', '/'],             desc: 'Comment / Uncomment dòng' },
      { keys: ['Ctrl', 'F'],             desc: 'Tìm kiếm trong code' },
      { keys: ['Ctrl', 'H'],             desc: 'Tìm và thay thế' },
      { keys: ['Ctrl', 'G'],             desc: 'Nhảy đến dòng số...' },
      { keys: ['Alt', '↑/↓'],           desc: 'Di chuyển dòng lên/xuống' },
      { keys: ['Ctrl', 'Shift', 'K'],    desc: 'Xóa dòng hiện tại' },
      { keys: ['Tab'],                   desc: 'Indent (trong Input: chèn 2 spaces)' },
      { keys: ['Shift', 'Tab'],          desc: 'Unindent' },
    ],
  },
  {
    title: 'Giao diện',
    items: [
      { keys: ['?'],                     desc: 'Mở / đóng modal phím tắt này' },
      { keys: ['Ctrl', 'Shift', 'P'],    desc: 'Command Palette Monaco (tìm mọi lệnh)' },
    ],
  },
  {
    title: 'Mobile (chạm)',
    items: [
      { keys: ['Long press'],            desc: 'Chọn từ, kéo để mở rộng vùng chọn' },
      { keys: ['Copy button'],           desc: 'Copy toàn bộ code hoặc vùng đã chọn' },
    ],
  },
];

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  // Close on Escape or ?
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        onClose();
      }
    };
    if (open) window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl max-h-[80vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-fade-in"
        style={{ background: '#0e0e1a', border: '1px solid #1f1f32' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Keyboard size={15} className="text-indigo-400" />
            <span className="text-sm font-semibold text-gray-100">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-xs text-gray-400">{item.desc}</span>
                    <div className="flex items-center gap-1 ml-4 shrink-0">
                      {item.keys.map((k, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          {ki > 0 && <span className="text-gray-700 text-[10px]">+</span>}
                          <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-300 rounded border border-gray-700 font-mono leading-4">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-border shrink-0">
          <p className="text-[10px] text-gray-700 text-center">
            Nhấn <kbd className="px-1 bg-gray-800 text-gray-500 rounded border border-gray-700 text-[9px]">?</kbd> hoặc <kbd className="px-1 bg-gray-800 text-gray-500 rounded border border-gray-700 text-[9px]">Esc</kbd> để đóng
          </p>
        </div>
      </div>
    </div>
  );
}
