import { NextRequest, NextResponse } from 'next/server';
import { compileAndRun } from '@/lib/compiler';

const MAX_CODE_BYTES  = 100 * 1024;   // 100 KB
const MAX_INPUT_BYTES = 10  * 1024;   // 10 KB
const RUN_TIMEOUT_MS  = 10_000;       // 10s

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

    if (typeof body !== 'object' || body === null)
      return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });

    const { code, input = '', optimize = false, langId = 'cpp20', extraFiles = [] } = body as {
      code: unknown; input?: unknown; optimize?: unknown; langId?: unknown; extraFiles?: unknown;
    };

    if (typeof code !== 'string' || code.trim() === '')
      return NextResponse.json({ error: 'Field "code" is required' }, { status: 400 });

    if (typeof input !== 'string')
      return NextResponse.json({ error: 'Field "input" must be a string' }, { status: 400 });

    if (Buffer.byteLength(code, 'utf-8') > MAX_CODE_BYTES)
      return NextResponse.json({ error: `Code too large (max ${MAX_CODE_BYTES / 1024}KB)` }, { status: 413 });

    if (Buffer.byteLength(input, 'utf-8') > MAX_INPUT_BYTES)
      return NextResponse.json({ error: `Input too large (max ${MAX_INPUT_BYTES / 1024}KB)` }, { status: 413 });

    const result = await compileAndRun(
      code, input, RUN_TIMEOUT_MS,
      optimize === true,
      typeof langId === 'string' ? langId : 'cpp20',
      extraFiles,
    );
    return NextResponse.json(result, { status: 200 });

  } catch (err) {
    console.error('[API/compile] Unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
