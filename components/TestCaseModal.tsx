'use client';

/**
 * components/TestCaseModal.tsx
 * Modal để edit một test case: label, input, expected output.
 */

import { useEffect, useRef, useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { TestCase } from '@/lib/testcases';

interface Props {
  testCase: TestCase | null;
  onSave:   (tc: TestCase) => void;
  onDelete: (id: string) => void;
  onClose:  () => void;
}

export default function TestCaseModal({ testCase, onSave, onDelete, onClose }: Props) {
  const [label,          setLabel]          = useState('');
  const [input,          setInput]          = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (testCase) {
      setLabel(testCase.label);
      setInput(testCase.input);
      setExpectedOutput(testCase.expectedOutput ?? '');
    }
  }, [testCase]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!testCase) return null;

  const handleSave = () => {
    onSave({ ...testCase, label: label.trim() || 'Test case', input, expectedOutput });
    onClose();
  };

  const taBase: React.CSSProperties = {
    background: '#080810',
    lineHeight: '1.6',
    caretColor: '#818cf8',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onPointerDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{
          width: 'min(680px, 94vw)',
          maxHeight: '88vh',
          background: '#0e0e1a',
          border: '1px solid #1f1f32',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: '#1f1f32' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="bg-transparent text-sm font-mono text-gray-200 outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
              style={{ minWidth: 80, maxWidth: 220 }}
              placeholder="Test case name"
            />
          </div>
          <button onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-200 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body — two sections stacked */}
        <div className="flex flex-col flex-1 overflow-y-auto min-h-0">

          {/* ── Input section ── */}
          <div className="flex flex-col" style={{ minHeight: 140 }}>
            <div className="px-4 py-2 border-b flex items-center gap-2 shrink-0"
              style={{ borderColor: '#1f1f32', background: '#0a0a16' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
              <span className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">
                stdin / input
              </span>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={"Nhập input cho test case này...\n(sẽ được truyền vào cin / sys.stdin)"}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 p-4 resize-none text-sm font-mono text-gray-200 outline-none"
              style={{ ...taBase, minHeight: 120 }}
            />
          </div>

          {/* Divider */}
          <div className="border-t shrink-0" style={{ borderColor: '#1f1f32' }} />

          {/* ── Expected Output section ── */}
          <div className="flex flex-col" style={{ minHeight: 120 }}>
            <div className="px-4 py-2 border-b flex items-center gap-2 shrink-0"
              style={{ borderColor: '#1f1f32', background: '#0a0a16' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              <span className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">
                expected output
              </span>
              <span className="text-[10px] text-gray-700 ml-auto">
                (để trống = không chấm điểm)
              </span>
            </div>
            <textarea
              value={expectedOutput}
              onChange={e => setExpectedOutput(e.target.value)}
              placeholder={"Nhập output mong muốn...\n(dùng để so sánh Pass/Fail sau khi chạy)"}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 p-4 resize-none text-sm font-mono text-emerald-300/80 outline-none"
              style={{ ...taBase, minHeight: 100, background: '#06100a' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t shrink-0"
          style={{ borderColor: '#1f1f32', background: '#0a0a16' }}>
          <button
            onClick={() => { onDelete(testCase.id); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
          >
            <Trash2 size={12} /> Xóa test case
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-md transition-colors">
              Hủy
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors">
              <Save size={12} /> Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
