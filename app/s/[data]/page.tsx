'use client';

/**
 * Trang share: giải nén fflate từ URL param → render editor đã fill sẵn.
 */

import { use, useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Home } from 'lucide-react';
import EditorLayout from '@/components/EditorLayout';

interface PageProps {
  params: Promise<{ data: string }>;
}

export default function SharePage({ params }: PageProps) {
  const { data } = use(params);
  const [initialCode, setInitialCode] = useState<string | undefined>(undefined);
  const [initialInput, setInitialInput] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(true);

  useEffect(() => {
    if (!data) { setError('Không có dữ liệu trong URL.'); setIsDecoding(false); return; }

    const decode = async () => {
      try {
        const { decompressFromBase64Url } = await import('@/lib/compress');
        const json = await decompressFromBase64Url(data);
        const parsed = JSON.parse(json);
        if (typeof parsed !== 'object' || parsed === null)
          throw new Error('Dữ liệu không đúng định dạng');
        setInitialCode(typeof parsed.code === 'string' ? parsed.code : '');
        setInitialInput(typeof parsed.input === 'string' ? parsed.input : '');
      } catch (err) {
        console.error('[SharePage] Decode error:', err);
        setError('Không thể giải mã link. Link có thể đã hỏng hoặc không hợp lệ.');
      } finally {
        setIsDecoding(false);
      }
    };

    decode();
  }, [data]);

  if (isDecoding) return (
    <div className="flex flex-col items-center justify-center h-screen bg-bg-base text-gray-400 gap-4">
      <Loader2 size={28} className="animate-spin text-indigo-400" />
      <p className="text-sm">Đang giải nén dữ liệu từ share link...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-bg-base gap-5 p-8">
      <AlertTriangle size={36} className="text-red-400" />
      <div className="text-center">
        <h2 className="text-base font-semibold text-red-400 mb-1">Lỗi giải mã</h2>
        <p className="text-xs text-gray-500 max-w-sm">{error}</p>
      </div>
      <a href="/"
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors">
        <Home size={14} /> Về trang chính
      </a>
    </div>
  );

  return <EditorLayout initialCode={initialCode} initialInput={initialInput} isSharedView />;
}
