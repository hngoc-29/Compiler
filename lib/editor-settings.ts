/**
 * lib/editor-settings.ts
 * Persistent editor settings stored in localStorage.
 */

export interface EditorSettings {
  // Suggestions
  suggestions: boolean;
  parameterHints: boolean;
  quickSuggestions: boolean;
  snippets: boolean;

  // Display
  minimap: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  bracketPairColorization: boolean;
  renderWhitespace: boolean;
  fontLigatures: boolean;
  smoothCaret: boolean;
  showWarnings: boolean;

  // Theme
  theme: 'vs-dark' | 'vs' | 'hc-black';

  // Font
  fontSize: number;
  tabSize: number;

  // Execution
  runTimeoutMs: number;   // 5000 | 10000 | 15000 | 30000
}

export const DEFAULT_SETTINGS: EditorSettings = {
  suggestions: true,
  parameterHints: true,
  quickSuggestions: true,
  snippets: true,

  minimap: false,
  wordWrap: false,
  lineNumbers: true,
  bracketPairColorization: true,
  renderWhitespace: false,
  fontLigatures: true,
  smoothCaret: true,
  showWarnings: true,

  theme: 'vs-dark',

  fontSize: 13,
  tabSize: 4,

  runTimeoutMs: 10_000,
};

const KEY = 'cpp-editor-settings-v1';

export function loadSettings(): EditorSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: EditorSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(s));
}
