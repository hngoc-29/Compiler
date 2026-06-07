'use client';

/**
 * lib/i18n-context.tsx
 * React context for language selection.
 * Persists preference to localStorage.
 *
 * Adding a new language: edit lib/i18n.ts only — nothing here changes.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, DEFAULT_LANG, SUPPORTED_LANGS, type Lang, type Translations } from './i18n/index';

interface I18nContextValue {
  lang:    Lang;
  t:       Translations;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang:    DEFAULT_LANG,
  t:       translations[DEFAULT_LANG],
  setLang: () => {},
});

const LS_KEY = 'cppeditor-lang';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  /* Read preference from localStorage on mount, validate against SUPPORTED_LANGS */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored && (SUPPORTED_LANGS as ReadonlyArray<string>).includes(stored)) {
        setLangState(stored as Lang);
      }
    } catch { /* ignore */ }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LS_KEY, l); } catch { /* ignore */ }
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
