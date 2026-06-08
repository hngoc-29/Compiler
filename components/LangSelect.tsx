'use client';

/**
 * components/LangSelect.tsx
 * Shared language selector dropdown.
 * Reads SUPPORTED_LANGS + LANG_NAMES dynamically — adding a new language
 * to lib/i18n/index.ts automatically makes it appear here, zero changes needed.
 */

import { useI18n } from '@/lib/i18n-context';
import { SUPPORTED_LANGS, LANG_NAMES, type Lang } from '@/lib/i18n';
import { Globe } from 'lucide-react';

interface LangSelectProps {
  /** 'sidebar' = full width with label; 'compact' = small inline for header */
  variant?: 'sidebar' | 'compact';
  className?: string;
}

export default function LangSelect({ variant = 'compact', className = '' }: LangSelectProps) {
  const { lang, setLang } = useI18n();

  const select = (
    <select
      value={lang}
      onChange={e => setLang(e.target.value as Lang)}
      className={`bg-[#1a1a2e] text-gray-300 border border-gray-700/60 rounded
        text-[11px] font-mono cursor-pointer transition-colors
        hover:border-indigo-500/60 focus:outline-none focus:border-indigo-500
        focus:ring-1 focus:ring-indigo-500/30
        ${variant === 'compact' ? 'px-1.5 py-1' : 'px-2 py-1.5 w-full'}
        ${className}`}
    >
      {SUPPORTED_LANGS.map(l => (
        <option key={l} value={l}>
          {LANG_NAMES[l]}
        </option>
      ))}
    </select>
  );

  if (variant === 'sidebar') {
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-2 px-0.5">
          <Globe size={11} className="text-gray-600" />
          <span className="text-[10px] text-gray-600 uppercase tracking-widest">Language</span>
        </div>
        {select}
      </div>
    );
  }

  return select;
}
