/**
 * lib/i18n/index.ts — Language registry
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Adding a new language — edit ONLY this file + create one new one:  ║
 * ║                                                                      ║
 * ║  1. Create  lib/i18n/<code>.ts   (copy en.ts, translate)            ║
 * ║  2. Import  it here                                                  ║
 * ║  3. Add     '<code>' to SUPPORTED_LANGS  (type auto-derives)        ║
 * ║  4. Add     display name to LANG_NAMES                              ║
 * ║  5. Add     to the translations registry                            ║
 * ║                                                                      ║
 * ║  TypeScript enforces steps 3-5 at compile time — zero guesswork.    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ── Imports (one per language file) ───────────────────────────────────────
import { en } from './en';
import { vi } from './vi';
import { ja } from './ja';

// ── Re-export types so consumers only need `from '@/lib/i18n'` ────────────
export type { Translations } from './types';

// ── ① Supported language codes ────────────────────────────────────────────
export const SUPPORTED_LANGS = ['en', 'vi', 'ja'] as const;
export type  Lang             = typeof SUPPORTED_LANGS[number];
export const DEFAULT_LANG: Lang = 'en';

// ── ② Display names for the language selector UI ──────────────────────────
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  ja: '日本語',
};

// ── ③ Translation registry ────────────────────────────────────────────────
export const translations: Record<Lang, import('./types').Translations> = {
  en,
  vi,
  ja,
};
