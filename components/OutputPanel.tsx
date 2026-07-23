'use client';

/**
 * components/OutputPanel.tsx
 * Hiển thị kết quả compile: tab Output, Errors, Info.
 * Warnings từ compiler được hiển thị màu vàng, tách biệt với errors màu đỏ.
 */

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import {
  Copy, Trash2, Terminal, AlertCircle, Info,
  Loader2, CheckCircle, XCircle, Clock, AlertTriangle, History, RotateCcw, Square, FileOutput,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/utils';
import { getHistory, clearHistory, type RunRecord } from '@/lib/run-history';
import { useI18n } from '@/lib/i18n-context';

export interface CompileResult {
  stdout: string;
  stderr: string;
  compileError: string | null;
  exitCode: number;
  runtime: number;
  timedOut: boolean;
  /** True when the run ended because the user hit Stop/Ctrl+C, not a crash. */
  stopped?: boolean;
  /** Files the program created or modified while running (e.g. an .OUT file
   *  written via ofstream) — read back after the run so they're viewable. */
  outputFiles?: { name: string; content: string; size: number }[];
}

interface OutputPanelProps {
  result: CompileResult | null;
  isLoading: boolean;
  onClear: () => void;
  showWarnings: boolean;
  isRunning?: boolean;
  onStdin?: (data: string) => void;
  onEndStdin?: () => void;
  /** Stop the running program — surfaced right in the terminal prompt row
   *  too (not just the Header button) since that's one less reach on mobile. */
  onStop?: () => void;
}

type TabId = 'output' | 'errors' | 'info' | 'history' | 'files';

// ─── Parse GCC/G++ diagnostic output ────────────────────────────────────────
interface ParsedDiagnostics {
  warnings: string[];
  errors: string[];
}

function parseCompilerOutput(raw: string): ParsedDiagnostics {
  if (!raw.trim()) return { warnings: [], errors: [] };

  const lines = raw.split('\n');
  const warnings: string[] = [];
  const errors: string[] = [];

  let currentLines: string[] = [];
  let currentType: 'w' | 'e' | null = null;

  const flush = () => {
    if (currentLines.length === 0) return;
    const block = currentLines.join('\n').trimEnd();
    if (block) {
      if (currentType === 'w') warnings.push(block);
      else errors.push(block);
    }
    currentLines = [];
    currentType = null;
  };

  for (const line of lines) {
    const isWarning = /:\s*warning:/.test(line);
    const isError = /:\s*(fatal\s+)?error:/.test(line);

    if (isWarning || isError) {
      flush();
      currentType = isWarning ? 'w' : 'e';
    }

    if (currentType === null && line.trim() === '') continue;
    if (currentType === null) currentType = 'e';

    currentLines.push(line);
  }
  flush();

  return { warnings, errors };
}

// Lines prefixed this way come from EditorLayout's own execution-engine
// verification logging (proving whether a run happened client-side/WASM or
// server-side — see runOnce), not from the program itself. Rendered visually
// distinct (dim, italic, blue) and interleaved in place, so it's obvious at a
// glance which lines are "meta" info and which are the program's real stdout.
const ENGINE_LOG_PREFIX = '⚙️ [Engine]';
// Lines starting with this marker are what the person typed into the live
// stdin bar, echoed back into the transcript by EditorLayout's
// handleSendStdin — mirrors how a real terminal always shows your own
// keystrokes inline, not just the program's replies.
const ECHO_PREFIX = '» ';

function renderStdout(stdout: string) {
  const lines = stdout.split('\n');
  const nodes: ReactNode[] = [];
  lines.forEach((line, i) => {
    if (line.startsWith(ENGINE_LOG_PREFIX)) {
      nodes.push(<span key={i} className="text-sky-400/80 italic">{line}</span>);
    } else if (line.startsWith(ECHO_PREFIX)) {
      nodes.push(<span key={i} className="text-white font-semibold">{line}</span>);
    } else {
      nodes.push(line);
    }
    if (i < lines.length - 1) nodes.push('\n');
  });
  return nodes;
}

export default function OutputPanel({ result, isLoading, onClear, showWarnings, isRunning, onStdin, onEndStdin, onStop }: OutputPanelProps) {
  const { t } = useI18n();
  const ot = t.output;
  const ui = t.ui;
  const [tab, setTab] = useState<TabId>('output');
  const [stdinInput, setStdinInput] = useState('');
  const stdinRef = useRef<HTMLInputElement>(null);
  const stdoutRef = useRef<HTMLPreElement>(null);
  // "Stuck to bottom" pattern: auto-scroll follows new output only while the
  // person hasn't manually scrolled up to read something earlier — scrolling
  // up opts out of auto-scroll until they scroll back down themselves again.
  const stickToBottomRef = useRef(true);

  const handleStdoutScroll = useCallback(() => {
    const el = stdoutRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 40; // small tolerance
  }, []);

  // BUG FIX: log output didn't auto-scroll — new lines kept streaming in but
  // the view stayed wherever it was, so on any real output you had to keep
  // manually dragging the scrollbar down to see what just printed.
  useEffect(() => {
    if (stickToBottomRef.current && stdoutRef.current) {
      stdoutRef.current.scrollTop = stdoutRef.current.scrollHeight;
    }
  }, [result?.stdout]);

  // A fresh run should always start stuck-to-bottom, even if the person had
  // scrolled up to read something from the previous run.
  useEffect(() => {
    if (isRunning) stickToBottomRef.current = true;
  }, [isRunning]);

  // Auto-focus stdin input when running starts
  useEffect(() => {
    if (isRunning && tab === 'output') {
      setTimeout(() => stdinRef.current?.focus(), 100);
    }
  }, [isRunning, tab]);

  const handleStdinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onStdin && isRunning) {
      onStdin(stdinInput + '\n');
      setStdinInput('');
    }
  };
  const [history, setHistory] = useState<RunRecord[]>(() => getHistory());

  // Refresh history when switching to the history tab
  const handleTabClick = useCallback((id: TabId) => {
    if (id === 'history') setHistory(getHistory());
    setTab(id);
  }, []);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    toast.success(ui.clear);
  };

  const { warnings, errors } = result?.compileError
    ? parseCompilerOutput(result.compileError)
    : { warnings: [], errors: [] };

  const visibleIssueCount =
    errors.length +
    (showWarnings ? warnings.length : 0) +
    (result?.stderr ? 1 : 0);

  const handleCopy = async () => {
    if (!result) return;
    let text = '';
    if (tab === 'output') text = result.stdout || '(no output)';
    else if (tab === 'errors') {
      const parts: string[] = [];
      if (errors.length) parts.push(errors.join('\n\n'));
      if (showWarnings && warnings.length) parts.push(warnings.join('\n\n'));
      if (result.stderr) parts.push(result.stderr);
      text = parts.join('\n\n') || '(no errors)';
    } else {
      text = `Exit: ${result.exitCode}\nRuntime: ${formatDuration(result.runtime)}\nTimeout: ${result.timedOut}`;
    }
    try { await navigator.clipboard.writeText(text); toast.success('Copied!'); }
    catch { toast.error(ui.copy); }
  };

  const statusBadge = () => {
    if (!result) return null;
    if (errors.length > 0)
      return <Badge color="red"><XCircle size={10} /> {ui.badges.compileError}</Badge>;
    if (showWarnings && warnings.length > 0)
      return <Badge color="yellow"><AlertTriangle size={10} /> {ui.badges.warning}</Badge>;
    if (result.timedOut)
      return <Badge color="yellow"><Clock size={10} /> {ui.badges.timeout}</Badge>;
    if (result.exitCode !== 0)
      return <Badge color="orange"><XCircle size={10} /> Exit {result.exitCode}</Badge>;
    return <Badge color="green"><CheckCircle size={10} /> OK · {formatDuration(result.runtime)}</Badge>;
  };

  const outputFiles = result?.outputFiles ?? [];
  const [activeFileTab, setActiveFileTab] = useState<string | null>(null);

  const tabs = [
    { id: 'output' as TabId, label: ui.tabs.output, icon: <Terminal size={11} /> },
    { id: 'errors' as TabId, label: ui.tabs.errors, icon: <AlertCircle size={11} />, badge: visibleIssueCount || undefined },
    ...(outputFiles.length > 0
      ? [{ id: 'files' as TabId, label: ot.filesTab, icon: <FileOutput size={11} />, badge: outputFiles.length, badgeColor: 'bg-sky-600' }]
      : []),
    { id: 'info' as TabId, label: ui.tabs.info, icon: <Info size={11} /> },
    { id: 'history' as TabId, label: ui.tabs.history, icon: <History size={11} />, badge: history.length || undefined, badgeColor: 'bg-gray-600' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="pane-bar">
        <div className="flex items-center gap-0.5">
          <span className="dot dot-red mr-2" />
          {tabs.map(t => (
            <button key={t.id} onClick={() => handleTabClick(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded transition-colors ${tab === t.id
                  ? 'bg-gray-700/70 text-gray-100'
                  : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800/50'
                }`}>
              {t.icon} {t.label}
              {t.badge !== undefined && (
                <span className={`px-1 rounded-full text-white text-[9px] leading-4 ${t.id === 'errors' && errors.length === 0 ? 'bg-yellow-600'
                    : (t as { badgeColor?: string }).badgeColor ?? 'bg-red-600'
                  }`}>
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
              title={ot.copy}>
              <Copy size={12} />
            </button>
          )}
          <button onClick={onClear}
            className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
            title={ot.clearOutput}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-bg-base">
        {isLoading && (
          <div className="flex items-center gap-3 p-4 text-gray-500">
            <Loader2 size={15} className="animate-spin text-indigo-400 shrink-0" />
            <span className="text-xs loading-pulse">{ot.compiling}</span>
          </div>
        )}

        {!isLoading && !result && !isRunning && (
          <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-2 p-8">
            <Terminal size={28} className="opacity-30" />
            <p className="text-xs text-center leading-relaxed">
              {ot.runHint.split('Run')[0]}<Kbd>Run</Kbd>{ot.runHint.split('Run')[1]?.split('Ctrl+Enter')[0]}<Kbd>Ctrl+Enter</Kbd>{ot.runHint.split('Ctrl+Enter')[1]}
            </p>
          </div>
        )}

        {(!isLoading && (result || isRunning) && tab === 'output') && (
          <div className="flex flex-col h-full">
            <pre ref={stdoutRef} onScroll={handleStdoutScroll} className="output-pre text-emerald-300 flex-1 overflow-auto">
              {result?.stdout ? renderStdout(result.stdout) : <span className="text-gray-700 italic">(no stdout)</span>}
              {result?.timedOut && (
                <span className="block mt-2 text-yellow-400">{ot.timeout}</span>
              )}
            </pre>
            {isRunning && (
              <div className="p-2 bg-gray-900/50 border-t border-emerald-500/30 shrink-0">
                <form onSubmit={handleStdinSubmit} className="flex gap-2 items-center">
                  {/* Same » used for echoed lines above — the live prompt reads
                      as a natural continuation of the transcript, not a
                      separate detached box. */}
                  <span className="text-emerald-400 font-mono text-xs font-semibold py-1.5 pl-1">»</span>
                  <input
                    ref={stdinRef}
                    type="text"
                    value={stdinInput}
                    onChange={e => setStdinInput(e.target.value)}
                    placeholder={ot.stdinPlaceholder}
                    className="flex-1 bg-transparent text-emerald-300 font-mono text-xs focus:outline-none placeholder:text-gray-700"
                    autoComplete="off"
                  />
                  {onEndStdin && (
                    <button
                      type="button"
                      onClick={onEndStdin}
                      className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 rounded transition-colors shrink-0"
                      title="Send EOF (Ctrl+D)"
                    >
                      EOF
                    </button>
                  )}
                  {/* Extra reach for Stop, right where the thumb already is on
                      mobile — the Header button works too, but this saves a
                      trip up the screen while typing input mid-run. */}
                  {onStop && (
                    <button
                      type="button"
                      onClick={onStop}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded transition-colors shrink-0"
                      title={`${ui.stop} (Ctrl+C)`}
                    >
                      <Square size={9} fill="currentColor" />
                      {ui.stop}
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        )}

        {!isLoading && result && tab === 'errors' && (
          <div className="p-3 space-y-4">

            {/* ── Compile errors (đỏ) ──────────────────────── */}
            {errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
                  <XCircle size={11} />
                  Compile Error{errors.length > 1 ? `s (${errors.length})` : ''}
                </p>
                {errors.map((block, i) => (
                  <pre key={i} className="output-pre text-red-300 bg-red-950/20 rounded p-3 text-xs whitespace-pre-wrap">
                    {block}
                  </pre>
                ))}
              </div>
            )}

            {/* ── Warnings (vàng) ── ẩn khi showWarnings=false */}
            {showWarnings && warnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-yellow-400 flex items-center gap-1">
                  <AlertTriangle size={11} />
                  Warning{warnings.length > 1 ? `s (${warnings.length})` : ''}
                </p>
                {warnings.map((block, i) => (
                  <pre key={i} className="output-pre text-yellow-300 bg-yellow-950/20 rounded p-3 text-xs whitespace-pre-wrap">
                    {block}
                  </pre>
                ))}
              </div>
            )}

            {/* ── Runtime stderr (cam) ─────────────────────── */}
            {result.stderr && (
              <div>
                <p className="text-[11px] font-semibold text-orange-400 mb-1.5 flex items-center gap-1">
                  <AlertCircle size={11} /> {ui.badges.runtimeStderr}
                </p>
                <pre className="output-pre text-orange-300 bg-orange-950/20 rounded p-3 text-xs">{result.stderr}</pre>
              </div>
            )}

            {/* ── All clear ────────────────────────────────── */}
            {errors.length === 0 && result.stderr === '' &&
              (!showWarnings || warnings.length === 0) && (
                <div className="flex items-center gap-2 text-green-400 text-xs p-4">
                  <CheckCircle size={14} />
                  {!showWarnings && warnings.length > 0
                    ? `No errors! (${warnings.length} warning${warnings.length !== 1 ? "s" : ""} hidden)`
                    : 'No errors!'}
                </div>
              )}
          </div>
        )}

        {!isLoading && result && tab === 'info' && (
          <div className="p-4 space-y-2.5 text-xs">
            <Row label={ot.infoLabels.compile} v={errors.length > 0 ? ot.infoValues.failed : ot.infoValues.success} vc={errors.length > 0 ? 'text-red-400' : 'text-green-400'} />
            <Row label={ot.infoLabels.exitCode} v={String(result.exitCode)} vc={result.exitCode === 0 ? 'text-green-400' : 'text-orange-400'} />
            <Row label={ot.infoLabels.runtime} v={errors.length > 0 ? ot.infoValues.na : formatDuration(result.runtime)} vc="text-blue-400" />
            <Row label={ot.infoLabels.timeout} v={result.timedOut ? ot.infoValues.yes : ot.infoValues.no} vc={result.timedOut ? 'text-yellow-400' : 'text-gray-500'} />
            <Row label="stdout size" v={`${result.stdout.length} chars`} vc="text-gray-500" />
            <Row label="stderr size" v={`${result.stderr.length} chars`} vc="text-gray-500" />
            <Row label={ot.infoLabels.warnings} v={warnings.length > 0 ? `${warnings.length} (${showWarnings ? ot.infoValues.shown : ot.infoValues.hidden})` : ot.infoValues.none} vc={warnings.length > 0 ? 'text-yellow-400' : 'text-gray-500'} />
          </div>
        )}
        {!isLoading && tab === 'files' && (
          <div className="flex h-full">
            <div className="w-32 shrink-0 border-r border-gray-800 overflow-y-auto py-1">
              {outputFiles.map(f => (
                <button
                  key={f.name}
                  onClick={() => setActiveFileTab(f.name)}
                  className={`w-full text-left px-2 py-1.5 text-[10px] font-mono truncate transition-colors ${
                    (activeFileTab ?? outputFiles[0]?.name) === f.name
                      ? 'bg-sky-900/30 text-sky-300'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
                  title={f.name}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              {(() => {
                const active = outputFiles.find(f => f.name === (activeFileTab ?? outputFiles[0]?.name)) ?? outputFiles[0];
                if (!active) return null;
                return (
                  <>
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 shrink-0">
                      <span className="text-[10px] text-gray-500">{active.size} bytes</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(active.content); toast.success(ot.copy); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
                        title={ot.copy}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                    <pre className="output-pre text-sky-200 flex-1 overflow-auto">{active.content || <span className="text-gray-700 italic">({ot.filesEmpty})</span>}</pre>
                  </>
                );
              })()}
            </div>
          </div>
        )}
        {!isLoading && tab === 'history' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
              <span className="text-[11px] text-gray-500">
                {ui.nRecentRuns(history.length)}
              </span>
              {history.length > 0 && (
                <button onClick={handleClearHistory}
                  className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-red-400 transition-colors">
                  <RotateCcw size={10} /> {ui.clear}
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-700 gap-2">
                <History size={24} className="opacity-30" />
                <p className="text-xs">{ot.noRuns}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto px-3 pb-3 space-y-2">
                {history.map((rec) => {
                  const hasError = !!(rec.compileError || (rec.exitCode !== 0 && !rec.timedOut));
                  const statusColor = rec.timedOut ? 'text-yellow-400'
                    : hasError ? 'text-red-400' : 'text-green-400';
                  const statusIcon = rec.timedOut ? <Clock size={10} />
                    : hasError ? <XCircle size={10} /> : <CheckCircle size={10} />;
                  return (
                    <div key={rec.id} className="bg-gray-800/30 rounded p-2.5 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1 font-medium ${statusColor}`}>
                          {statusIcon}
                          {rec.timedOut ? ot.historyStatus.timeout : hasError ? ot.historyStatus.error : ot.historyStatus.ok}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-mono">{rec.langId}</span>
                          <span>{rec.timedOut ? '⏱' : formatDuration(rec.runtime)}</span>
                          <span>{new Date(rec.ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </div>
                      {rec.stdout && (
                        <pre className="text-emerald-400/80 bg-gray-900/50 rounded px-2 py-1 text-[10px] truncate max-h-12 overflow-hidden">
                          {rec.stdout.slice(0, 200)}
                        </pre>
                      )}
                      {rec.compileError && (
                        <pre className="text-red-400/80 bg-red-950/20 rounded px-2 py-1 text-[10px] truncate">
                          {rec.compileError.split('\n')[0].slice(0, 120)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-900/40 text-red-400',
    yellow: 'bg-yellow-900/40 text-yellow-400',
    orange: 'bg-orange-900/40 text-orange-400',
    green: 'bg-green-900/40 text-green-400',
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
