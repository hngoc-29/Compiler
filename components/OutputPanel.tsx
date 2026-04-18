'use client';

/**
 * components/OutputPanel.tsx
 * Hiển thị kết quả compile: tab Output, Errors, Info.
 */

import { useState } from 'react';
import {
  Copy, Trash2, Terminal, AlertCircle, Info,
  Loader2, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/utils';

export interface CompileResult {
  stdout:       string;
  stderr:       string;
  compileError: string | null;
  exitCode:     number;
  runtime:      number;
  timedOut:     boolean;
}

interface OutputPanelProps {
  result:    CompileResult | null;
  isLoading: boolean;
  onClear:   () => void;
}

type TabId = 'output' | 'errors' | 'info';

export default function OutputPanel({ result, isLoading, onClear }: OutputPanelProps) {
  const [tab, setTab] = useState<TabId>('output');

  const errCount = result
    ? (result.compileError ? 1 : 0) + (result.stderr ? 1 : 0)
    : 0;

  const handleCopy = async () => {
    if (!result) return;
    let text = '';
    if (tab === 'output') text = result.stdout || '(no output)';
    else if (tab === 'errors')
      text = [result.compileError, result.stderr].filter(Boolean).join('\n\n') || '(no errors)';
    else
      text = `Exit: ${result.exitCode}\nRuntime: ${formatDuration(result.runtime)}\nTimeout: ${result.timedOut}`;
    try { await navigator.clipboard.writeText(text); toast.success('Đã copy!'); }
    catch { toast.error('Không thể copy'); }
  };

  // Badge trạng thái nhỏ bên phải header
  const statusBadge = () => {
    if (!result) return null;
    if (result.compileError)
      return <Badge color="red"><XCircle size={10}/> Compile Error</Badge>;
    if (result.timedOut)
      return <Badge color="yellow"><Clock size={10}/> Timeout</Badge>;
    if (result.exitCode !== 0)
      return <Badge color="orange"><XCircle size={10}/> Exit {result.exitCode}</Badge>;
    return <Badge color="green"><CheckCircle size={10}/> OK · {formatDuration(result.runtime)}</Badge>;
  };

  const tabs = [
    { id: 'output' as TabId,  label: 'Output', icon: <Terminal   size={11}/> },
    { id: 'errors' as TabId,  label: 'Errors', icon: <AlertCircle size={11}/>, badge: errCount || undefined },
    { id: 'info'   as TabId,  label: 'Info',   icon: <Info        size={11}/> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="pane-bar">
        <div className="flex items-center gap-0.5">
          <span className="dot dot-red mr-2" />
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded transition-colors ${
                tab === t.id
                  ? 'bg-gray-700/70 text-gray-100'
                  : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800/50'
              }`}>
              {t.icon} {t.label}
              {t.badge !== undefined && (
                <span className="px-1 rounded-full bg-red-600 text-white text-[9px] leading-4">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {statusBadge()}
          {result && (
            <button onClick={handleCopy}
              className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
              title="Copy">
              <Copy size={12}/>
            </button>
          )}
          <button onClick={onClear}
            className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
            title="Xóa output">
            <Trash2 size={12}/>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-bg-base">
        {isLoading && (
          <div className="flex items-center gap-3 p-4 text-gray-500">
            <Loader2 size={15} className="animate-spin text-indigo-400 shrink-0"/>
            <span className="text-xs loading-pulse">Đang compile và chạy...</span>
          </div>
        )}

        {!isLoading && !result && (
          <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-2 p-8">
            <Terminal size={28} className="opacity-30"/>
            <p className="text-xs text-center leading-relaxed">
              Nhấn <Kbd>Run</Kbd> hoặc <Kbd>Ctrl+Enter</Kbd> để compile
            </p>
          </div>
        )}

        {!isLoading && result && tab === 'output' && (
          <pre className="output-pre text-emerald-300">
            {result.stdout || <span className="text-gray-700 italic">(no stdout)</span>}
            {result.timedOut && (
              <span className="block mt-2 text-yellow-400">⏱ Chương trình bị dừng do timeout.</span>
            )}
          </pre>
        )}

        {!isLoading && result && tab === 'errors' && (
          <div className="p-3 space-y-3">
            {result.compileError && (
              <div>
                <p className="text-[11px] font-semibold text-red-400 mb-1.5 flex items-center gap-1">
                  <XCircle size={11}/> Compile Error
                </p>
                <pre className="output-pre text-red-300 bg-red-950/20 rounded p-3 text-xs">{result.compileError}</pre>
              </div>
            )}
            {result.stderr && (
              <div>
                <p className="text-[11px] font-semibold text-orange-400 mb-1.5 flex items-center gap-1">
                  <AlertCircle size={11}/> Runtime Stderr
                </p>
                <pre className="output-pre text-orange-300 bg-orange-950/20 rounded p-3 text-xs">{result.stderr}</pre>
              </div>
            )}
            {!result.compileError && !result.stderr && (
              <div className="flex items-center gap-2 text-green-400 text-xs p-4">
                <CheckCircle size={14}/> Không có lỗi!
              </div>
            )}
          </div>
        )}

        {!isLoading && result && tab === 'info' && (
          <div className="p-4 space-y-2.5 text-xs">
            <Row label="Compile"     v={result.compileError ? '❌ Thất bại' : '✅ Thành công'} vc={result.compileError ? 'text-red-400' : 'text-green-400'}/>
            <Row label="Exit code"   v={String(result.exitCode)} vc={result.exitCode === 0 ? 'text-green-400' : 'text-orange-400'}/>
            <Row label="Runtime"     v={result.compileError ? 'N/A' : formatDuration(result.runtime)} vc="text-blue-400"/>
            <Row label="Timeout"     v={result.timedOut ? '⚠️ Có' : 'Không'} vc={result.timedOut ? 'text-yellow-400' : 'text-gray-500'}/>
            <Row label="stdout size" v={`${result.stdout.length} chars`} vc="text-gray-500"/>
            <Row label="stderr size" v={`${result.stderr.length} chars`} vc="text-gray-500"/>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    red:    'bg-red-900/40 text-red-400',
    yellow: 'bg-yellow-900/40 text-yellow-400',
    orange: 'bg-orange-900/40 text-orange-400',
    green:  'bg-green-900/40 text-green-400',
  };
  return (
    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${colors[color] ?? ''}`}>
      {children}
    </span>
  );
}

function Row({ label, v, vc }: { label: string; v: string; vc: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border">
      <span className="text-gray-500">{label}</span>
      <span className={`font-mono font-medium ${vc}`}>{v}</span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-400 rounded border border-gray-700">
      {children}
    </kbd>
  );
}
