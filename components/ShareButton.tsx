'use client';

/**
 * components/ShareButton.tsx
 * Nén {code, input} bằng fflate → tạo URL /s/[base64url] → copy clipboard.
 */

import { useState } from 'react';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SHARE_WARN_BYTES, formatBytes } from '@/lib/utils';

interface ShareButtonProps {
  code:  string;
  input: string;
}

export default function ShareButton({ code, input }: ShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl,     setShareUrl]     = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);

  const handleShare = async () => {
    if (isGenerating) return;

    const payload      = JSON.stringify({ code, input });
    const payloadBytes = new TextEncoder().encode(payload).length;

    if (payloadBytes > SHARE_WARN_BYTES) {
      toast.warning(
        `Dữ liệu khá lớn (${formatBytes(payloadBytes)}). URL có thể rất dài.`,
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
      toast.success('Đã tạo và copy share link!', {
        description: `${url.length} ký tự · nén từ ${formatBytes(payloadBytes)}`,
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('[ShareButton]', err);
      toast.error('Tạo link thất bại. Thử lại sau.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAgain = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Đã copy link!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Không thể copy'); }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleShare}
        disabled={isGenerating}
        title="Tạo share link (nén fflate)"
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
