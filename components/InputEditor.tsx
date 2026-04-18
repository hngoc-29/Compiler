'use client';

/**
 * components/InputEditor.tsx
 * Textarea đơn giản để nhập stdin (input.txt).
 */

import { useRef } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface InputEditorProps {
  value:    string;
  onChange: (v: string) => void;
}

export default function InputEditor({ value, onChange }: InputEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(value); toast.success('Đã copy input!'); }
    catch { toast.error('Không thể copy'); }
  };

  const handleClear = () => { onChange(''); taRef.current?.focus(); };

  // Tab key → chèn 2 spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta    = e.currentTarget;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const next  = value.substring(0, start) + '  ' + value.substring(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + 2;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="pane-bar">
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
            <Copy size={12} />
          </button>
          <button onClick={handleClear}
            className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
            title="Xóa">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={"Nhập stdin ở đây...\n(nội dung sẽ truyền vào cin)"}
        spellCheck={false}
        autoComplete="off"
        className="code-textarea flex-1"
      />
    </div>
  );
}
