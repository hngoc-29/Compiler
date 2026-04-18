/**
 * lib/compress.ts
 *
 * Nén/giải nén bằng LZMA level 9 (nén mạnh nhất, URL ngắn nhất).
 * Dùng package `lzma` – pure JavaScript, hoạt động cả browser lẫn Node.js.
 *
 * Tại sao LZMA level 9 cho URL ngắn hơn fflate/deflate?
 *   - LZMA dùng dictionary size lớn hơn và chuỗi back-reference dài hơn.
 *   - Với C++ source code (lặp nhiều keyword), LZMA nén tốt hơn deflate ~20-35%.
 *   - Level 9 = dictionary 64MB, word size 273 → nén chặt nhất có thể.
 *
 * Encoding:
 *   Bytes (number[]) → base64url (URL-safe, không cần percent-encode).
 *   64 ký tự: A-Za-z0-9 + '-' + '_', không có padding '='.
 */

// Type cho lzma instance (package không ship .d.ts)
type LZMAInstance = {
  compress(
    data: string | number[],
    mode: number,
    on_finish: (result: number[], error: unknown) => void,
    on_progress?: (percent: number) => void
  ): void;
  decompress(
    data: number[] | Uint8Array,
    on_finish: (result: string | null, error: unknown) => void,
    on_progress?: (percent: number) => void
  ): void;
};

// Lazy singleton
let _lzma: LZMAInstance | null = null;

function getLZMA(): LZMAInstance {
  if (_lzma) return _lzma;
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const mod: any = require('lzma');
  const Ctor = mod.LZMA ?? mod.default?.LZMA ?? mod;
  _lzma = (typeof Ctor === 'function' ? new Ctor() : Ctor) as LZMAInstance;
  return _lzma;
}

// ──────────────────────────────────────────────────────
// Encoding helpers
// ──────────────────────────────────────────────────────

/**
 * number[] → base64url string.
 * Xử lý theo chunk 8192 để tránh stack overflow với mảng lớn.
 */
function bytesToBase64Url(bytes: number[]): string {
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(
      ...bytes.slice(i, i + CHUNK).map((b) => b & 0xff)
    );
  }
  const b64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * base64url string → number[].
 */
function base64UrlToBytes(b64url: string): number[] {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary =
    typeof atob !== 'undefined'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('binary');
  const result: number[] = new Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    result[i] = binary.charCodeAt(i) & 0xff;
  }
  return result;
}

// ──────────────────────────────────────────────────────
// Public async API (dùng ở cả client lẫn server)
// ──────────────────────────────────────────────────────

/**
 * Nén chuỗi bằng LZMA level 9, trả về base64url.
 * Level 9: dictionary 64MB, cho URL ngắn nhất.
 */
export async function compressToBase64Url(data: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    getLZMA().compress(data, 9, (result, error) => {
      if (error) { reject(new Error(`LZMA compress lỗi: ${error}`)); return; }
      try { resolve(bytesToBase64Url(result)); } catch (e) { reject(e); }
    });
  });
}

/**
 * Giải nén base64url (LZMA) về string gốc.
 */
export async function decompressFromBase64Url(b64url: string): Promise<string> {
  if (!b64url || typeof b64url !== 'string')
    throw new Error('Input không hợp lệ: cần chuỗi base64url');

  let bytes: number[];
  try { bytes = base64UrlToBytes(b64url); }
  catch (err) { throw new Error(`Lỗi decode base64url: ${err}`); }

  return new Promise<string>((resolve, reject) => {
    getLZMA().decompress(bytes, (result, error) => {
      if (error) { reject(new Error(`LZMA decompress lỗi: ${error}`)); return; }
      if (result === null || result === undefined) {
        reject(new Error('LZMA decompress trả về null – dữ liệu bị hỏng'));
        return;
      }
      resolve(result);
    });
  });
}
