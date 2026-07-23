'use client';

/**
 * components/ShareButton.tsx
 * Nén {code, input, testCases} bằng fflate → tạo URL /s/[base64url] → copy clipboard.
 */

import { useState } from 'react';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n-context';
import { SHARE_WARN_BYTES, formatBytes } from '@/lib/utils';
import { type TestCase, serializeTestCases } from '@/lib/testcases';

interface ExtraFileShare {
  id: string;
  name: string;
  content: string;
}

interface ShareButtonProps {
  code:       string;
  input:      string;
  testCases?: TestCase[];
  extraFiles?: ExtraFileShare[];
}

export default function ShareButton({ code, input, testCases, extraFiles }: ShareButtonProps) {
  const { t } = useI18n();
  const ui = t.ui;
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl,     setShareUrl]     = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);

  const handleShare = async () => {
    if (isGenerating) return;

    const saved = serializeTestCases(
      testCases ?? [{ id: '', label: 'Test 1', input, expectedOutput: '', output: null, error: null, status: 'idle', runtime: 0 }]
    );

    const payload      = JSON.stringify({ code, input, testCases: saved, extraFiles: extraFiles ?? [] });
    const payloadBytes = new TextEncoder().encode(payload).length;

    if (payloadBytes > SHARE_WARN_BYTES) {
      toast.warning(
        `Data is quite large (${formatBytes(payloadBytes)}). URL may be very long.`,
        { duration: 4000 }
      );
    }

    setIsGenerating(true);
    setShareUrl(null);

    try {
      // fflate là sync, dùng dynamic import để tree-shake phần server không cần
      const { compressToBase64Url } = await import('@/lib/compress');
      const compressed = await compressToBase64Url(payload);
      const url = `${window.location.origin}/s/${compressed}`;

      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Share link created and copied!', {
        description: `${url.length} chars · compressed from ${formatBytes(payloadBytes)}`,
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('[ShareButton]', err);
      toast.error('Failed to create link. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAgain = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Cannot copy'); }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleShare}
        disabled={isGenerating}
        title={ui.shareLink}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors">
        {isGenerating
          ? <Loader2 size={12} className="animate-spin"/>
          : <Share2  size={12}/>}
        {isGenerating ? 'Đang nén...' : 'Share'}
      </button>

      {shareUrl && (
        <button
          onClick={handleCopyAgain}
          title={shareUrl}
          className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors">
          {copied
            ? <Check size={12} className="text-green-400"/>
            : <Copy  size={12}/>}
        </button>
      )}
    </div>
  );
}
