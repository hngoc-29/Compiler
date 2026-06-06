/**
 * lib/user-prefs.ts
 * Persistent UI preferences stored in localStorage.
 *
 * Separate from EditorSettings (font/toggles) — covers the higher-level
 * choices a user makes: language, optimize flag, which panels are visible,
 * and which run-mode tab was active last session.
 */

import { DEFAULT_LANG_ID } from './languages';

export interface PanelWidths {
  codeRatio:  number;          // codeW / containerWidth (0–1)
  inputRatio: number;          // inputW / containerWidth (0–1)
}

export interface UserPrefs {
  langId:      string;           // 'cpp20' | 'cpp17' | 'c11' | 'python3' …
  optimize:    boolean;          // -O2 flag
  panels:      PanelPrefs;
  activeTab:   'single' | 'testcases';
  panelWidths: PanelWidths;      // desktop panel sizes, persisted across sessions
}

export interface PanelPrefs {
  code:   boolean;
  input:  boolean;
  output: boolean;
}

export const DEFAULT_PREFS: UserPrefs = {
  langId:      DEFAULT_LANG_ID,
  optimize:    false,
  panels:      { code: true, input: true, output: true },
  activeTab:   'single',
  panelWidths: { codeRatio: 1 / 3, inputRatio: 1 / 3 },
};

const KEY = 'codeeditor-user-prefs-v1';

/** Return a clean copy of DEFAULT_PREFS (all nested objects cloned) */
const defaultReturn = (): UserPrefs => ({
  ...DEFAULT_PREFS,
  panels:      { ...DEFAULT_PREFS.panels },
  panelWidths: { ...DEFAULT_PREFS.panelWidths },
});

export function loadPrefs(): UserPrefs {
  if (typeof window === 'undefined') return defaultReturn();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultReturn();
    const parsed = JSON.parse(raw) as Partial<UserPrefs>;
    const clampRatio = (n: unknown, def: number): number => {
      const v = typeof n === 'number' && Number.isFinite(n) ? n : def;
      return Math.max(0.05, Math.min(0.9, v));
    };
    return {
      langId:      parsed.langId    ?? DEFAULT_PREFS.langId,
      optimize:    parsed.optimize  ?? DEFAULT_PREFS.optimize,
      activeTab:   parsed.activeTab ?? DEFAULT_PREFS.activeTab,
      panels: {
        code:   parsed.panels?.code   ?? DEFAULT_PREFS.panels.code,
        input:  parsed.panels?.input  ?? DEFAULT_PREFS.panels.input,
        output: parsed.panels?.output ?? DEFAULT_PREFS.panels.output,
      },
      panelWidths: {
        codeRatio:  clampRatio(parsed.panelWidths?.codeRatio,  DEFAULT_PREFS.panelWidths.codeRatio),
        inputRatio: clampRatio(parsed.panelWidths?.inputRatio, DEFAULT_PREFS.panelWidths.inputRatio),
      },
    };
  } catch {
    return defaultReturn();
  }
}

export function savePrefs(p: UserPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch { /* quota exceeded — silently ignore */ }
}
