/**
 * lib/user-prefs.ts
 * Persistent UI preferences stored in localStorage.
 *
 * Separate from EditorSettings (font/toggles) — covers the higher-level
 * choices a user makes: language, optimize flag, which panels are visible,
 * and which run-mode tab was active last session.
 */

import { DEFAULT_LANG_ID } from './languages';

export interface UserPrefs {
  langId:    string;           // 'cpp20' | 'cpp17' | 'c11' | 'python3' …
  optimize:  boolean;          // -O2 flag
  panels:    PanelPrefs;
  activeTab: 'single' | 'testcases';
}

export interface PanelPrefs {
  code:   boolean;
  input:  boolean;
  output: boolean;
}

export const DEFAULT_PREFS: UserPrefs = {
  langId:    DEFAULT_LANG_ID,
  optimize:  false,
  panels:    { code: true, input: true, output: true },
  activeTab: 'single',
};

const KEY = 'codeeditor-user-prefs-v1';

export function loadPrefs(): UserPrefs {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS, panels: { ...DEFAULT_PREFS.panels } };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS, panels: { ...DEFAULT_PREFS.panels } };
    const parsed = JSON.parse(raw) as Partial<UserPrefs>;
    return {
      langId:    parsed.langId    ?? DEFAULT_PREFS.langId,
      optimize:  parsed.optimize  ?? DEFAULT_PREFS.optimize,
      activeTab: parsed.activeTab ?? DEFAULT_PREFS.activeTab,
      panels: {
        code:   parsed.panels?.code   ?? DEFAULT_PREFS.panels.code,
        input:  parsed.panels?.input  ?? DEFAULT_PREFS.panels.input,
        output: parsed.panels?.output ?? DEFAULT_PREFS.panels.output,
      },
    };
  } catch {
    return { ...DEFAULT_PREFS, panels: { ...DEFAULT_PREFS.panels } };
  }
}

export function savePrefs(p: UserPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch { /* quota exceeded — silently ignore */ }
}
