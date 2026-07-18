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
  useWasm: boolean;       // Run code in browser using WASM
  // NEW: forces the running program's stdout/stderr to be unbuffered at the
  // OS level (stdbuf -o0 -e0 / python3 -u) and streams it to the UI in small
  // throttled bursts as it's produced, instead of whatever big, uneven
  // chunks the OS pipe's own buffering happens to deliver. Default true —
  // old behavior stays available by turning this off.
  realtimeLogs: boolean;
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
  useWasm: false,
  realtimeLogs: true,
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
