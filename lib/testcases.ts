/**
 * lib/testcases.ts
 * Type và utils cho multiple test cases.
 */

export interface TestCase {
  id:             string;
  label:          string;
  input:          string;
  expectedOutput: string;  // output mong muốn để so sánh (chấm điểm)
  output:         string | null;  // kết quả thực tế sau khi chạy
  error:          string | null;
  status:         'idle' | 'running' | 'ok' | 'error' | 'timeout' | 'wrong';
  runtime:        number;
}

/** UUID polyfill: dùng crypto.randomUUID nếu có, fallback sang getRandomValues */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID() as string;
  }
  // Fallback: build UUID v4 from getRandomValues (available in all modern browsers)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
  const h = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

export function createTestCase(label?: string): TestCase {
  return {
    id:             generateId(),
    label:          label ?? 'Test case',
    input:          '',
    expectedOutput: '',
    output:         null,
    error:          null,
    status:         'idle',
    runtime:        0,
  };
}

/** So sánh output thực tế với expected (trim trailing whitespace mỗi dòng) */
export function compareOutput(actual: string, expected: string): boolean {
  if (!expected.trim()) return true; // không có expected → không chấm
  const normalize = (s: string) =>
    s.split('\n').map(l => l.trimEnd()).join('\n').trim();
  return normalize(actual) === normalize(expected);
}

export const DEFAULT_TEST_CASES: TestCase[] = [
  { ...createTestCase('Test 1'), input: '' },
];
