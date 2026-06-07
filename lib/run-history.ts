/**
 * lib/run-history.ts
 * Lưu lịch sử run trong sessionStorage (mất khi đóng tab).
 * Tối đa MAX_HISTORY lần, mới nhất lên đầu.
 */

export interface RunRecord {
  id:        string;
  ts:        number;   // Date.now()
  langId:    string;
  code:      string;
  input:     string;
  stdout:    string;
  stderr:    string;
  compileError: string | null;
  exitCode:  number;
  runtime:   number;
  timedOut:  boolean;
}

const SESSION_KEY  = 'cppeditor_run_history_v1';
const MAX_HISTORY  = 20;

function randId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function getHistory(): RunRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as RunRecord[]) : [];
  } catch { return []; }
}

export function addToHistory(record: Omit<RunRecord, 'id' | 'ts'>): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    history.unshift({ ...record, id: randId(), ts: Date.now() });
    if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(history));
  } catch { /* sessionStorage full */ }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}
