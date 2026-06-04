'use client';

/**
 * components/LanguageSelector.tsx
 * Dropdown chọn ngôn ngữ / version compiler.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { LANG_VERSIONS, type LangVersion } from '@/lib/languages';

interface Props {
  value:    string;
  onChange: (id: string) => void;
}

const LANG_COLORS: Record<string, string> = {
  cpp:    '#60a5fa', // blue
  c:      '#a78bfa', // violet
  python: '#34d399', // green
};

export default function LanguageSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = LANG_VERSIONS.find(l => l.id === value) ?? LANG_VERSIONS[0];

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Group by language
  const groups = LANG_VERSIONS.reduce<Record<string, LangVersion[]>>((acc, lv) => {
    (acc[lv.lang] = acc[lv.lang] ?? []).push(lv);
    return acc;
  }, {});

  const groupLabels: Record<string, string> = {
    cpp: 'C++', c: 'C', python: 'Python', java: 'Java',
  };

  const dotColor = LANG_COLORS[selected.lang] ?? '#94a3b8';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all border border-gray-700/60 hover:border-gray-600"
        style={{ background: 'rgba(255,255,255,0.04)', color: '#d1d5db' }}
        title="Chọn ngôn ngữ"
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: dotColor }}
        />
        {selected.label}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden"
          style={{
            minWidth: 160,
            background: '#0e0e1a',
            border: '1px solid #1f1f32',
          }}
        >
          {Object.entries(groups).map(([lang, versions]) => (
            <div key={lang}>
              <div className="px-3 py-1 text-[10px] uppercase tracking-widest"
                style={{ color: LANG_COLORS[lang] ?? '#6b7280' }}>
                {groupLabels[lang] ?? lang}
              </div>
              {versions.map(lv => (
                <button
                  key={lv.id}
                  onClick={() => { onChange(lv.id); setOpen(false); }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs hover:bg-gray-700/40 transition-colors"
                  style={{ color: lv.id === value ? '#fff' : '#9ca3af' }}
                >
                  <span className="font-mono">{lv.label}</span>
                  {lv.id === value && <Check size={11} className="text-indigo-400" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
