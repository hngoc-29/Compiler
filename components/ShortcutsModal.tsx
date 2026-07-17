'use client';

/**
 * components/ShortcutsModal.tsx
 * Modal showing all keyboard shortcuts — opened by pressing ? or Help button.
 */

import { useEffect, useState } from 'react';
import { X, Keyboard, Edit2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import type { Shortcuts } from '@/lib/shortcuts';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  shortcuts: Shortcuts;
  onChange: (s: Shortcuts) => void;
}

export default function ShortcutsModal({ open, onClose, shortcuts, onChange }: ShortcutsModalProps) {
  const { t } = useI18n();
  const sm = t.shortcutsModal;
  const [recordingKey, setRecordingKey] = useState<keyof Shortcuts | null>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (recordingKey) {
        e.preventDefault();
        e.stopPropagation();

        const key = e.key;
        if (key === 'Escape') {
          setRecordingKey(null);
          return;
        }

        // Ignore standalone modifier presses
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return;

        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Cmd');

        let keyName = key;
        if (key === ' ') keyName = 'Space';
        else if (key.length === 1) keyName = key.toUpperCase();

        parts.push(keyName);

        onChange({ ...shortcuts, [recordingKey]: parts.join('+') });
        setRecordingKey(null);
        return;
      }

      if (e.key === 'Escape') onClose();
      if (
        e.key === '?' && !e.ctrlKey && !e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) onClose();
    };
    if (open) window.addEventListener('keydown', fn, { capture: true });
    return () => window.removeEventListener('keydown', fn, { capture: true });
  }, [open, onClose, recordingKey, shortcuts, onChange]);

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
            <span className="text-sm font-semibold text-gray-100">{sm.title}</span>
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
          {sm.sections.map(section => (
            <div key={section.title}>
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, i) => {
                  // BUG FIX: this used to detect the editable row by checking whether
                  // item.desc contained the literal English string 'Compile & Run' or
                  // the Vietnamese 'Chạy code'. The ja/zh translations don't contain
                  // either substring (they're fully translated, e.g. 'コンパイル&実行'),
                  // so shortcutKey stayed null and the edit (pencil) button never
                  // appeared at all in those locales — shortcut customization was
                  // silently unreachable outside en/vi. item.id is locale-independent.
                  const shortcutKey = item.id ?? null;

                  const isRecording = recordingKey === shortcutKey;
                  const displayKeys = shortcutKey ? shortcuts[shortcutKey].split('+') : item.keys;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 group"
                    >
                      <span className="text-xs text-gray-400">{item.desc}</span>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        {shortcutKey && (
                          <button
                            onClick={() => setRecordingKey(isRecording ? null : shortcutKey)}
                            className={`p-1 rounded transition-colors ${isRecording ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800 opacity-0 group-hover:opacity-100'}`}
                            title="Edit shortcut"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        <div className="flex items-center gap-1">
                          {isRecording ? (
                            <span className="text-[10px] text-indigo-400 animate-pulse">Press keys... (Esc to cancel)</span>
                          ) : (
                            displayKeys.map((k, ki) => (
                              <span key={ki} className="flex items-center gap-1">
                                {ki > 0 && <span className="text-gray-700 text-[10px]">+</span>}
                                <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-300 rounded border border-gray-700 font-mono leading-4">
                                  {k}
                                </kbd>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-border shrink-0">
          <p className="text-[10px] text-gray-700 text-center">
            {sm.footer.split('?')[0]}
            <kbd className="px-1 bg-gray-800 text-gray-500 rounded border border-gray-700 text-[9px]">?</kbd>
            {sm.footer.split('?')[1]?.split('Esc')[0]}
            <kbd className="px-1 bg-gray-800 text-gray-500 rounded border border-gray-700 text-[9px]">Esc</kbd>
            {sm.footer.split('Esc')[1]}
          </p>
        </div>
      </div>
    </div>
  );
}
