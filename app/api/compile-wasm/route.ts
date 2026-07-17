import { NextRequest, NextResponse } from 'next/server';
import { compileToWasm } from '@/lib/compiler';

const MAX_CODE_BYTES = 100 * 1024;   // 100 KB

export async function POST(req: NextRequest) {
    try {
        let body: unknown;
        try { body = await req.json(); }
        catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

        if (typeof body !== 'object' || body === null)
            return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });

        const { code, optimize = false, langId = 'cpp20' } = body as {
            code: unknown; optimize?: unknown; langId?: unknown;
        };

        if (typeof code !== 'string' || code.trim() === '')
            return NextResponse.json({ error: 'Field "code" is required' }, { status: 400 });

        if (Buffer.byteLength(code, 'utf-8') > MAX_CODE_BYTES)
            return NextResponse.json({ error: `Code too large (max ${MAX_CODE_BYTES / 1024}KB)` }, { status: 413 });

        const result = await compileToWasm(
            code,
            optimize === true,
            typeof langId === 'string' ? langId : 'cpp20',
        );
        return NextResponse.json(result, { status: 200 });

    } catch (err) {
        console.error('[API/compile-wasm] Unexpected:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
