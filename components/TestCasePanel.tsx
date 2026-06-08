'use client';

/**
 * components/TestCasePanel.tsx
 * Panel hiển thị + chạy nhiều test cases, có chấm Pass/Fail.
 * Hỗ trợ export/import bộ test cases dưới dạng JSON.
 */

import { useRef, useState } from 'react';
import {
  Plus, Play, Pencil, CheckCircle, XCircle,
  Clock, Loader2, Terminal, ChevronDown, ChevronRight,
  AlertTriangle, Download, Upload, RotateCcw, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TestCase } from '@/lib/testcases';
import { createTestCase, compareOutput, exportTestCasesToJson, importTestCasesFromJson, duplicateTestCase } from '@/lib/testcases';
import TestCaseModal from './TestCaseModal';
import { formatDuration, downloadTextFile } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';

interface Props {
  testCases:    TestCase[];
  onUpdate:     (cases: TestCase[]) => void;
  onRunAll:     () => void;
  onRunOne:     (tc: TestCase) => void;
  isRunningAll: boolean;
  runningId:    string | null;
}

function StatusIcon({ status }: { status: TestCase['status'] }) {
  if (status === 'running') return <Loader2     size={12} className="animate-spin text-indigo-400" />;
  if (status === 'ok')      return <CheckCircle size={12} className="text-green-400" />;
  if (status === 'wrong')   return <XCircle     size={12} className="text-red-400" />;
  if (status === 'error')   return <AlertTriangle size={12} className="text-orange-400" />;
  if (status === 'timeout') return <Clock       size={12} className="text-yellow-400" />;
  return <Terminal size={12} className="text-gray-600" />;
}

function VerdictBadge({ tc }: { tc: TestCase }) {
  if (tc.status === 'idle' || tc.status === 'running') return null;
  if (tc.status === 'timeout') return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400">TLE</span>
  );
  if (tc.status === 'error') return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-400">ERR</span>
  );
  if (tc.status === 'wrong') return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/40 text-red-400">FAIL</span>
  );
  if (tc.status === 'ok') {
    const hasExpected = tc.expectedOutput.trim().length > 0;
    return hasExpected ? (
      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-900/40 text-green-400">PASS</span>
    ) : (
      <span className="text-[10px] font-mono text-green-500">{formatDuration(tc.runtime)}</span>
    );
  }
  return null;
}

export default function TestCasePanel({
  testCases, onUpdate, onRunAll, onRunOne, isRunningAll, runningId,
}: Props) {
  const { t } = useI18n();
  const tcp = t.testCasePanel;
  const [editingTc, setEditingTc]   = useState<TestCase | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const addTestCase = () => {
    const tc = createTestCase(`Test ${testCases.length + 1}`);
    onUpdate([...testCases, tc]);
    setEditingTc(tc);
  };

  const handleSave = (updated: TestCase) => {
    onUpdate(testCases.map(tc => tc.id === updated.id ? updated : tc));
  };

  const handleDelete = (id: string) => {
    const next = testCases.filter(tc => tc.id !== id);
    onUpdate(next.length > 0 ? next : [createTestCase('Test 1')]);
  };

  const toggleExpand = (id: string) =>
    setExpandedId(prev => prev === id ? null : id);

  // ─── Reset all results ────────────────────────────────────────────────────
  const handleReset = () => {
    onUpdate(testCases.map(tc => ({ ...tc, status: 'idle' as const, output: null, error: null, runtime: 0 })));
  };

  // ─── Duplicate a test case ────────────────────────────────────────────────
  const handleDuplicate = (tc: TestCase) => {
    const newLabel = `${tc.label} (copy)`;
    const duped = duplicateTestCase(tc, newLabel);
    const idx = testCases.findIndex(t => t.id === tc.id);
    const next = [...testCases];
    next.splice(idx + 1, 0, duped);
    onUpdate(next);
    toast.success(tcp.duplicated(tc.label));
  };

  // ─── Export ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      downloadTextFile(exportTestCasesToJson(testCases), 'testcases.json');
      toast.success(tcp.exportedN(testCases.length));
    } catch {
      toast.error(tcp.exportError);
    }
  };

  // ─── Import ──────────────────────────────────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string;
        const parsed: unknown = JSON.parse(json);
        const imported = importTestCasesFromJson(parsed);
        onUpdate(imported);
        toast.success(tcp.importedN(imported.length));
      } catch {
        toast.error(tcp.importError);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Summary bar
  const ran = testCases.filter(tc => tc.status !== 'idle' && tc.status !== 'running');
  const passed  = ran.filter(tc => tc.status === 'ok').length;
  const failed  = ran.filter(tc => tc.status === 'wrong' || tc.status === 'error').length;
  const timeout = ran.filter(tc => tc.status === 'timeout').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Header */}
      <div className="pane-bar">
        <div className="flex items-center gap-2">
          <span className="dot dot-yellow" />
          <span className="text-xs font-mono text-gray-400">Test Cases</span>
          <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-mono">
            {testCases.length}
          </span>
          {/* Summary */}
          {ran.length > 0 && (
            <div className="flex items-center gap-1.5 ml-1">
              {passed  > 0 && <span className="text-[10px] text-green-400 font-mono">{passed}✓</span>}
              {failed  > 0 && <span className="text-[10px] text-red-400 font-mono">{failed}✗</span>}
              {timeout > 0 && <span className="text-[10px] text-yellow-400 font-mono">{timeout}⏱</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Reset results */}
          {ran.length > 0 && (
            <button
              onClick={handleReset}
              className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors"
              title={tcp.resetResults}
            >
              <RotateCcw size={11} />
            </button>
          )}
          {/* Export */}
          <button
            onClick={handleExport}
            className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors"
            title={t.ui.exportTestCases}
          >
            <Download size={11} />
          </button>
          {/* Import */}
          <button
            onClick={() => importInputRef.current?.click()}
            className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors"
            title={t.ui.importTestCases}
          >
            <Upload size={11} />
          </button>
          <div className="w-px h-3 bg-gray-700 mx-0.5" />
          <button
            onClick={addTestCase}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-colors"
            title={tcp.addTestCase}
          >
            <Plus size={11} /> Add
          </button>
          <button
            onClick={onRunAll}
            disabled={isRunningAll}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-50 text-white rounded transition-colors"
            title={tcp.runAll}
          >
            {isRunningAll
              ? <Loader2 size={11} className="animate-spin" />
              : <Play size={11} />}
            Run All
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {testCases.map((tc) => {
          const isRunning    = tc.id === runningId;
          const effectStatus = isRunning ? 'running' : tc.status;
          const hasExpected  = tc.expectedOutput?.trim().length > 0;

          return (
            <div key={tc.id} className="border-b" style={{ borderColor: '#1a1a2c' }}>
              {/* Row */}
              <div
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800/30 group cursor-pointer select-none"
                onClick={() => toggleExpand(tc.id)}
              >
                <span className="text-gray-600 flex-shrink-0">
                  {expandedId === tc.id
                    ? <ChevronDown size={11} />
                    : <ChevronRight size={11} />}
                </span>

                <StatusIcon status={effectStatus} />

                <span className="flex-1 text-xs text-gray-300 font-mono truncate">{tc.label}</span>

                {hasExpected && tc.status === 'idle' && (
                  <span className="text-[9px] text-gray-700 flex-shrink-0">has expected</span>
                )}

                <VerdictBadge tc={{ ...tc, status: effectStatus }} />

                {/* Actions */}
                <div
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setEditingTc(tc)}
                    className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
                    title={tcp.editTestCase}
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(tc)}
                    className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
                    title={t.ui.duplicateTestCase}
                  >
                    <Copy size={10} />
                  </button>
                  <button
                    onClick={() => onRunOne(tc)}
                    disabled={!!runningId}
                    className="p-1 rounded hover:bg-indigo-600/50 text-gray-600 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                    title={tcp.runThis}
                  >
                    <Play size={10} />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === tc.id && (
                <div className="px-3 pb-3 space-y-2 ml-5">
                  {/* Input */}
                  {tc.input && (
                    <div>
                      <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wider">Input</p>
                      <pre className="text-[11px] text-gray-400 font-mono bg-gray-900/50 rounded p-2 max-h-20 overflow-auto whitespace-pre-wrap break-all">
                        {tc.input}
                      </pre>
                    </div>
                  )}

                  {/* Actual output + comparison */}
                  {tc.output !== null && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Output</p>
                        {hasExpected && tc.status !== 'idle' && tc.status !== 'running' && (
                          compareOutput(tc.output ?? '', tc.expectedOutput)
                            ? <span className="text-[10px] text-green-400 font-mono flex items-center gap-0.5">
                                <CheckCircle size={9} /> Match
                              </span>
                            : <span className="text-[10px] text-red-400 font-mono flex items-center gap-0.5">
                                <XCircle size={9} /> Mismatch
                              </span>
                        )}
                        {tc.runtime > 0 && (
                          <span className="text-[10px] text-gray-600 font-mono ml-auto">
                            {formatDuration(tc.runtime)}
                          </span>
                        )}
                      </div>
                      <pre className={`text-[11px] font-mono rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap break-all ${
                        tc.status === 'wrong'
                          ? 'bg-red-950/30 text-red-300 border border-red-900/40'
                          : 'bg-gray-900/50 text-emerald-300'
                      }`}>
                        {tc.output || <span className="italic text-gray-600">(no output)</span>}
                      </pre>
                    </div>
                  )}

                  {/* Expected output (when there's a mismatch, show side-by-side) */}
                  {hasExpected && tc.status === 'wrong' && (
                    <div>
                      <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wider">Expected</p>
                      <pre className="text-[11px] font-mono bg-green-950/30 text-green-300 border border-green-900/40 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap break-all">
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  )}

                  {/* Expected (show hint when idle and has expected) */}
                  {hasExpected && tc.status === 'idle' && (
                    <div>
                      <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wider">Expected</p>
                      <pre className="text-[11px] font-mono bg-gray-900/30 text-gray-500 rounded p-2 max-h-20 overflow-auto whitespace-pre-wrap break-all">
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  )}

                  {/* Error / stderr */}
                  {tc.error && (
                    <div>
                      <p className="text-[10px] text-orange-500 mb-1 uppercase tracking-wider">Error</p>
                      <pre className="text-[11px] text-orange-300 font-mono bg-orange-950/30 rounded p-2 max-h-24 overflow-auto whitespace-pre-wrap break-all">
                        {tc.error}
                      </pre>
                    </div>
                  )}

                  {tc.status === 'idle' && !hasExpected && (
                    <p className="text-[11px] text-gray-700 italic">
                      Chưa chạy. Nhấn <span className="text-indigo-400">▶</span> để chạy.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {editingTc && (
        <TestCaseModal
          testCase={editingTc}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingTc(null)}
        />
      )}
    </div>
  );
}
