/**
 * lib/utils.ts – hàm tiện ích dùng chung
 */

// ─── Debounce ───
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T, delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => { fn(...args); timer = null; }, delay);
  };
}

// ─── Format ───
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Constants ───
export const MAX_CODE_BYTES   = 100 * 1024;
export const MAX_INPUT_BYTES  = 10  * 1024;
export const SHARE_WARN_BYTES = 60  * 1024;
export const AUTOSAVE_KEY     = 'cppeditor_autosave_v2';

// ─── Download helper ───
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── Default C++ template ───
export const DEFAULT_CPP_CODE = `#include <bits/stdc++.h>
using namespace std;

// Fast I/O template – chuẩn competitive programming
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin >> n;

    cout << "Hello from CppEditor!" << endl;
    cout << "n = " << n << endl;

    return 0;
}
`;

export const DEFAULT_INPUT = `5\n`;

// ─── Clamp helper ───
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
