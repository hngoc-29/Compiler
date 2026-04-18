/**
 * lib/compress.ts
 *
 * Nén/giải nén bằng fflate (deflate level 9) – pure JavaScript,
 * KHÔNG cần Web Worker, hoạt động hoàn hảo cả browser lẫn Node.js.
 *
 * ❌ Trước: dùng package `lzma` → crash trên browser vì nó tìm
 *    Web Worker tại /src/lzma_worker.js (không được Next.js serve).
 * ✅ Sau:  dùng `fflate` → không cần Worker, đồng bộ, nhẹ hơn.
 *
 * Encoding: Bytes (Uint8Array) → base64url (URL-safe, không cần percent-encode).
 */

import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate';

// ──────────────────────────────────────────────────────
// Encoding helpers
// ──────────────────────────────────────────────────────

function bytesToBase64Url(bytes: Uint8Array): string {
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const b64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary =
    typeof atob !== 'undefined'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('binary');
  const result = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    result[i] = binary.charCodeAt(i) & 0xff;
  }
  return result;
}

// ──────────────────────────────────────────────────────
// Public API (dùng ở cả client lẫn server)
// ──────────────────────────────────────────────────────

/**
 * Nén chuỗi bằng deflate level 9, trả về base64url.
 */
export async function compressToBase64Url(data: string): Promise<string> {
  const input = strToU8(data);
  const compressed = deflateSync(input, { level: 9 });
  return bytesToBase64Url(compressed);
}

/**
 * Giải nén base64url (deflate) về string gốc.
 */
export async function decompressFromBase64Url(b64url: string): Promise<string> {
  if (!b64url || typeof b64url !== 'string')
    throw new Error('Input không hợp lệ: cần chuỗi base64url');

  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(b64url);
  } catch (err) {
    throw new Error(`Lỗi decode base64url: ${err}`);
  }

  const decompressed = inflateSync(bytes);
  return strFromU8(decompressed);
}
