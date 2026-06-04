/**
 * lib/editor-settings.ts
 * Persistent editor settings stored in localStorage.
 */

export interface EditorSettings {
  // Suggestions
  suggestions: boolean;          // master toggle
  parameterHints: boolean;       // function signature hints
  quickSuggestions: boolean;     // inline suggestions while typing
  snippets: boolean;             // code snippets

  // Display
  minimap: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  bracketPairColorization: boolean;
  renderWhitespace: boolean;
  fontLigatures: boolean;
  smoothCaret: boolean;

  // Font
  fontSize: number;              // 11-20
  tabSize: number;               // 2 or 4
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

  fontSize: 13,
  tabSize: 4,
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
