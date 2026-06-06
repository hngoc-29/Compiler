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

// ─── Serialisation helpers (for URL sharing + autosave) ──────────────────────

/** Minimal shape saved to URL / localStorage — no runtime fields */
export interface SavedTestCase {
  id:             string;
  label:          string;
  input:          string;
  expectedOutput: string;
}

/** Strip runtime fields before serialising */
export function serializeTestCases(tcs: TestCase[]): SavedTestCase[] {
  return tcs.map(({ id, label, input, expectedOutput }) => ({
    id, label, input, expectedOutput,
  }));
}

/** Restore from saved form, initialising runtime fields to idle */
export function deserializeTestCases(saved: unknown): TestCase[] {
  if (!Array.isArray(saved) || saved.length === 0) return DEFAULT_TEST_CASES;
  const restored = (saved as SavedTestCase[])
    .filter((s) => s && typeof s.id === 'string')
    .map((s): TestCase => ({
      id:             s.id,
      label:          typeof s.label          === 'string' ? s.label          : 'Test case',
      input:          typeof s.input          === 'string' ? s.input          : '',
      expectedOutput: typeof s.expectedOutput === 'string' ? s.expectedOutput : '',
      output:  null,
      error:   null,
      status:  'idle',
      runtime: 0,
    }));
  return restored.length > 0 ? restored : DEFAULT_TEST_CASES;
}

/** Export: strip IDs so the file is clean and hand-editable */
export function exportTestCasesToJson(tcs: TestCase[]): string {
  const data = tcs.map(({ label, input, expectedOutput }) => ({
    label, input, expectedOutput,
  }));
  return JSON.stringify(data, null, 2);
}

/** Import: parse exported JSON, always regenerate IDs to avoid conflicts */
export function importTestCasesFromJson(raw: unknown): TestCase[] {
  const arr: unknown = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.testcases)
      ? (raw as Record<string, unknown>).testcases
      : null;

  if (!Array.isArray(arr) || arr.length === 0) return DEFAULT_TEST_CASES;

  const imported = (arr as Partial<SavedTestCase>[])
    .filter(item => item && typeof item === 'object')
    .map((item, i): TestCase => ({
      id:             generateId(),
      label:          typeof item.label          === 'string' ? item.label.trim() || `Test ${i + 1}` : `Test ${i + 1}`,
      input:          typeof item.input          === 'string' ? item.input          : '',
      expectedOutput: typeof item.expectedOutput === 'string' ? item.expectedOutput : '',
      output:  null,
      error:   null,
      status:  'idle',
      runtime: 0,
    }));

  return imported.length > 0 ? imported : DEFAULT_TEST_CASES;
}
