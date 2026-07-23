'use client';

/**
 * components/Header.tsx
 * v2 – Thêm nút mở InputDrawer trên mobile (onOpenInput prop)
 */

import { useState, useRef, useEffect } from 'react';
import {
  Play, Square, Download, ChevronDown,
  FileCode, FileText, FileOutput, Cpu,
  PanelLeft, PanelRight, Zap, Gauge, Terminal, Settings2,
} from 'lucide-react';
import ShareButton from './ShareButton';
import { downloadTextFile } from '@/lib/utils';
import { toast } from 'sonner';
import { type TestCase } from '@/lib/testcases';
import { useI18n } from '@/lib/i18n-context';

export interface PanelVisibility {
  code:   boolean;
  input:  boolean;
  output: boolean;
}

interface CompileResult { stdout: string }

interface HeaderProps {
  code:             string;
  input:            string;
  output:           CompileResult | null;
  isCompiling:      boolean;
  onRun:            () => void;
  /** Dừng chương trình đang chạy (nút Run biến thành Stop khi isCompiling). */
  onStop?:          () => void;
  panels:           PanelVisibility;
  onTogglePanel:    (p: keyof PanelVisibility) => void;
  optimize:         boolean;
  onToggleOptimize: () => void;
  isSharedView?:    boolean;
  langId?:          string;
  /** Mobile only: mở InputDrawer */
  onOpenInput?:     () => void;
  /** Có nội dung trong input không (để hiển thị dot indicator) */
  inputHasContent?: boolean;
  /** Open settings panel */
  onOpenSettings?:  () => void;
  minimal?:         boolean;
  testCases?:       TestCase[];
  extraFiles?:      { id: string; name: string; content: string }[];
}

export default function Header({
  code, input, output, isCompiling, onRun, onStop,
  panels, onTogglePanel,
  optimize, onToggleOptimize,
  isSharedView = false,
  langId = 'cpp20',
  onOpenInput,
  inputHasContent = false,
  minimal = false,
  onOpenSettings,
  testCases,
  extraFiles,
}: HeaderProps) {
  const { t } = useI18n();
  const ht = t.header;
  const ui = t.ui;
  const el = t.editorLayout;
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Source filename based on language
  const srcFilename = langId.startsWith('python') ? 'main.py'
    : langId === 'c11' ? 'main.c'
    : 'main.cpp';
  const srcHint = langId.startsWith('python') ? ui.srcHints.python
    : langId === 'c11' ? ui.srcHints.c
    : ui.srcHints.cpp;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const doDownload = (defaultName: string, content: string) => {
    const name = window.prompt(ht.filenamePrompt, defaultName);
    if (name === null) return;
    downloadTextFile(content, name.trim() || defaultName);
    toast.success(ht.downloadSuccess(name.trim() || defaultName));
    setExportOpen(false);
  };

  const exportItems = [
    { icon: <FileCode   size={13}/>, label: srcFilename, hint: srcHint,    onClick: () => doDownload(srcFilename, code) },
    { icon: <FileText   size={13}/>, label: 'input.txt',  hint: ui.fileHints.stdin, onClick: () => doDownload('input.txt',  input) },
    { icon: <FileOutput size={13}/>, label: 'output.txt', hint: ui.fileHints.stdout,      disabled: !output,
      onClick: () => output && doDownload('output.txt', output.stdout) },
  ];

  // Trên desktop: hiện panel toggles; trên mobile: ẩn (không cần)
  const panelButtons: { key: keyof PanelVisibility; label: string; icon: React.ReactNode }[] = [
    { key: 'code',   label: 'main.cpp',  icon: <FileCode   size={12}/> },
    { key: 'input',  label: 'input.txt', icon: <FileText   size={12}/> },
    { key: 'output', label: 'output',    icon: <PanelRight size={12}/> },
  ];

  // Minimal mode: just actions (EditorLayout has its own header wrapper)
  if (minimal) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {onOpenInput && (
          <button onClick={onOpenInput} className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 text-xs font-medium rounded-md transition-colors border border-gray-700/50" title={ht.openInput}>
            <Terminal size={12}/><span>{ui.input}</span>
            {inputHasContent && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400"/>}
          </button>
        )}
        <button onClick={onToggleOptimize} title={optimize ? ui.optimizeOn : ui.optimizeOff}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all border ${optimize ? 'bg-amber-900/40 border-amber-700/50 text-amber-300 hover:bg-amber-800/40' : 'bg-emerald-900/30 border-emerald-700/40 text-emerald-400 hover:bg-emerald-800/30'}`}>
          {optimize ? <><Gauge size={11}/><span className="hidden sm:inline">O2</span></> : <><Zap size={11}/><span className="hidden sm:inline">Fast</span></>}
        </button>
        <button onClick={isCompiling ? onStop : onRun} disabled={isCompiling && !onStop} title={isCompiling ? `${ui.stop} (Ctrl+C)` : `${ui.run} (Ctrl+Enter)`}
          className={`flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors ${isCompiling ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
          {isCompiling ? <Square size={12} fill="currentColor"/> : <Play size={12}/>}
          <span className="hidden sm:inline">{isCompiling ? (ui.stop) : 'Run'}</span>
          <kbd className="hidden lg:inline text-[9px] opacity-40 ml-0.5">{isCompiling ? '^C' : '⌘↵'}</kbd>
        </button>
        <div className="relative" ref={exportRef}>
          <button onClick={() => setExportOpen(v => !v)} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-md transition-colors" title={ht.download}>
            <Download size={12}/><span className="hidden sm:inline">Export</span>
            <ChevronDown size={10} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`}/>
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a2e] border border-border rounded-lg shadow-2xl z-50 py-1">
              {exportItems.map(item => (
                <button key={item.label} onClick={item.onClick} disabled={item.disabled}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left">
                  <span className="text-gray-600">{item.icon}</span>
                  <div><div className="font-mono font-medium">{item.label}</div><div className="text-gray-600 text-[10px]">{item.hint}</div></div>
                </button>
              ))}
            </div>
          )}
        </div>
        <ShareButton code={code} input={input} testCases={testCases} extraFiles={extraFiles}/>
        {onOpenSettings && (
          <button onClick={onOpenSettings} title={el.editorSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 text-xs font-medium rounded-md transition-colors border border-gray-700/50">
            <Settings2 size={12}/>
          </button>
        )}
      </div>
    );
  }

  return (
    <header className="flex items-center justify-between px-3 py-1.5 bg-bg-header border-b border-border shrink-0 z-20 gap-2">

      {/* ── Logo ── */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1 rounded bg-indigo-600/20">
          <Cpu size={16} className="text-indigo-400"/>
        </div>
        <span className="text-sm font-bold text-gray-100 tracking-tight hidden sm:block">CppEditor</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-mono">C++20</span>
        {isSharedView && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-900/40 text-violet-400 border border-violet-800/50">
            Shared
          </span>
        )}
      </div>

      {/* ── Centre: panel toggles (desktop) / empty (mobile) ── */}
      <div className="flex items-center gap-1 flex-1 justify-center">
        {/* Desktop: show panel toggles */}
        {!onOpenInput && (
          <>
            <PanelLeft size={11} className="text-gray-600 mr-0.5"/>
            {panelButtons.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => onTogglePanel(key)}
                className={`panel-toggle ${panels[key] ? 'active' : 'inactive'}`}
                title={panels[key] ? `Hide ${label}` : `Show ${label}`}
              >
                {icon}
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Mobile: nút mở Input drawer */}
        {onOpenInput && (
          <button
            onClick={onOpenInput}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 text-xs font-medium rounded-md transition-colors border border-gray-700/50"
            title={ht.openInput}
          >
            <Terminal size={12}/>
            <span>{ui.input}</span>
            {inputHasContent && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400"/>
            )}
          </button>
        )}

        {/* Optimize toggle */}
        <button
          onClick={onToggleOptimize}
          title={optimize
            ? 'Optimize mode (-O2). Click to switch to Fast (-O0).'
            : 'Fast mode (-O0). Click to switch to Optimize (-O2).'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all border ${
            optimize
              ? 'bg-amber-900/40 border-amber-700/50 text-amber-300 hover:bg-amber-800/40'
              : 'bg-emerald-900/30 border-emerald-700/40 text-emerald-400 hover:bg-emerald-800/30'
          }`}
        >
          {optimize
            ? <><Gauge size={11}/><span className="hidden sm:inline">O2</span></>
            : <><Zap   size={11}/><span className="hidden sm:inline">Fast</span></>}
        </button>

        {/* Run / Stop — becomes Stop (red) while a program is running so it's
            reachable with one tap on mobile where Ctrl+C doesn't exist. */}
        <button
          onClick={isCompiling ? onStop : onRun}
          disabled={isCompiling && !onStop}
          title={isCompiling ? `${ui.stop} (Ctrl+C)` : `${ui.run} (Ctrl+Enter)`}
          className={`flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors ${
            isCompiling ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          {isCompiling
            ? <Square size={12} fill="currentColor"/>
            : <Play    size={12}/>}
          <span className="hidden sm:inline">{isCompiling ? (ui.stop) : 'Run'}</span>
          <kbd className="hidden lg:inline text-[9px] opacity-40 ml-0.5">{isCompiling ? '^C' : '⌘↵'}</kbd>
        </button>

        {/* Export */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-md transition-colors"
            title={ht.download}
          >
            <Download size={12}/>
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={10} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`}/>
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a2e] border border-border rounded-lg shadow-2xl z-50 py-1">
              {exportItems.map(item => (
                <button key={item.label} onClick={item.onClick}
                  disabled={item.disabled}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <span className="text-gray-600">{item.icon}</span>
                  <div>
                    <div className="font-mono font-medium">{item.label}</div>
                    <div className="text-gray-600 text-[10px]">{item.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Share */}
        <ShareButton code={code} input={input} testCases={testCases} extraFiles={extraFiles}/>

        {/* Settings */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title={el.editorSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 text-xs font-medium rounded-md transition-colors border border-gray-700/50"
          >
            <Settings2 size={12}/>
            <span className="hidden sm:inline">Settings</span>
          </button>
        )}
      </div>
    </header>
  );
}
