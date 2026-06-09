/**
 * lib/i18n.ts — Single entry point for the i18n system.
 *
 * This file is the authoritative registry. TypeScript always prefers
 * a `.ts` file over a same-named folder, so this always wins over
 * any stale lib/i18n/index.ts.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  To add a new language:                                              ║
 * ║  1. Create  lib/i18n/<code>.ts  (copy en.ts, translate)             ║
 * ║  2. Import  it below                                                 ║
 * ║  3. Add     '<code>' to SUPPORTED_LANGS                             ║
 * ║  4. Add     display name to LANG_NAMES                              ║
 * ║  5. Add     to translations registry                                ║
 * ║  TypeScript will error on compile if any step is missed.            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ── Language files (one import per language) ──────────────────────────────
import { en } from './i18n/en';
import { vi } from './i18n/vi';
import { ja } from './i18n/ja';
import { zh } from './i18n/zh'; //chinese

// ── Re-export the Translations type ──────────────────────────────────────
export type { Translations } from './i18n/types';

// ── ① Supported codes — Lang type is auto-derived, never write it by hand ─
export const SUPPORTED_LANGS = ['en', 'vi', 'ja', 'zh'] as const;
export type  Lang             = typeof SUPPORTED_LANGS[number];
export const DEFAULT_LANG: Lang = 'en';

// ── ② Display names shown in the language selector ────────────────────────
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  ja: '日本語',
  zh: '中文',
};

// ── ③ Registry — TS errors if any language is missing ────────────────────
export const translations: Record<Lang, import('./i18n/types').Translations> = {
  en,
  vi,
  ja,
  zh,
};
