'use client';

/**
 * components/Header.tsx
 * Thanh header: Logo | Panel toggles | Optimize toggle | Run | Export | Share
 */

import { useState, useRef, useEffect } from 'react';
import {
  Play, Loader2, Download, ChevronDown,
  FileCode, FileText, FileOutput, Cpu,
  PanelLeft, PanelRight, Zap, Gauge,
} from 'lucide-react';
import ShareButton from './ShareButton';
import { downloadTextFile } from '@/lib/utils';
import { toast } from 'sonner';

export interface PanelVisibility {
  code:   boolean;
  input:  boolean;
  output: boolean;
}

interface CompileResult { stdout: string }

interface HeaderProps {
  code:          string;
  input:         string;
  output:        CompileResult | null;
  isCompiling:   boolean;
  onRun:         () => void;
  panels:        PanelVisibility;
  onTogglePanel: (p: keyof PanelVisibility) => void;
  optimize:      boolean;
  onToggleOptimize: () => void;
  isSharedView?: boolean;
}

export default function Header({
  code, input, output, isCompiling, onRun,
  panels, onTogglePanel,
  optimize, onToggleOptimize,
  isSharedView = false,
}: HeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const doDownload = (defaultName: string, content: string) => {
    const name = window.prompt(`Tên file:`, defaultName);
    if (name === null) return;
    downloadTextFile(content, name.trim() || defaultName);
    toast.success(`Đã tải ${name.trim() || defaultName}`);
    setExportOpen(false);
  };

  const exportItems = [
    { icon: <FileCode   size={13}/>, label: 'main.cpp',   hint: 'C++ source',   onClick: () => doDownload('main.cpp',   code) },
    { icon: <FileText   size={13}/>, label: 'input.txt',  hint: 'Stdin input',  onClick: () => doDownload('input.txt',  input) },
    { icon: <FileOutput size={13}/>, label: 'output.txt', hint: 'Stdout',       disabled: !output,
      onClick: () => output && doDownload('output.txt', output.stdout) },
  ];

  const panelButtons: { key: keyof PanelVisibility; label: string; icon: React.ReactNode }[] = [
    { key: 'code',   label: 'main.cpp',   icon: <FileCode   size={12}/> },
    { key: 'input',  label: 'input.txt',  icon: <FileText   size={12}/> },
    { key: 'output', label: 'output',     icon: <PanelRight size={12}/> },
  ];

  return (
    <header className="flex items-center justify-between px-3 py-1.5 bg-bg-header border-b border-border shrink-0 z-20 gap-2 flex-wrap">

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

      {/* ── Panel toggles (giữa) ── */}
      <div className="flex items-center gap-1 flex-1 justify-center">
        <PanelLeft size={11} className="text-gray-600 mr-0.5"/>
        {panelButtons.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onTogglePanel(key)}
            className={`panel-toggle ${panels[key] ? 'active' : 'inactive'}`}
            title={panels[key] ? `Ẩn ${label}` : `Hiện ${label}`}
          >
            {icon}
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Actions (phải) ── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* ── Optimize toggle ── */}
        <button
          onClick={onToggleOptimize}
          title={optimize
            ? 'Chế độ Optimize (-O2): compile chậm hơn nhưng chạy nhanh hơn. Nhấn để chuyển về Fast.'
            : 'Chế độ Fast (-O0): compile nhanh nhất. Nhấn để chuyển sang Optimize (-O2).'}
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

        {/* Run */}
        <button
          onClick={onRun}
          disabled={isCompiling}
          title={`Compile & Run (Ctrl+Enter) · ${optimize ? '-O2 optimize' : '-O0 fast'}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors">
          {isCompiling
            ? <Loader2 size={12} className="animate-spin"/>
            : <Play    size={12}/>}
          <span className="hidden sm:inline">{isCompiling ? 'Running...' : 'Run'}</span>
          <kbd className="hidden lg:inline text-[9px] opacity-40 ml-0.5">⌘↵</kbd>
        </button>

        {/* Export dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-md transition-colors"
            title="Tải file">
            <Download size={12}/>
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={10} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`}/>
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a2e] border border-border rounded-lg shadow-2xl z-50 py-1 animate-slide-in">
              {exportItems.map(item => (
                <button key={item.label} onClick={item.onClick}
                  disabled={item.disabled}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left">
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
        <ShareButton code={code} input={input}/>
      </div>
    </header>
  );
}
