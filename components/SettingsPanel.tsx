'use client';

/**
 * components/SettingsPanel.tsx
 * A slide-in settings panel for editor preferences.
 * Includes toggles for suggestions, display options, font size, tab size.
 */

import { useEffect, useRef } from 'react';
import { X, Sparkles, Eye, Type, Code2 } from 'lucide-react';
import { EditorSettings } from '@/lib/editor-settings';

interface SettingsPanelProps {
  open:     boolean;
  onClose:  () => void;
  settings: EditorSettings;
  onChange: (s: EditorSettings) => void;
}

interface ToggleRowProps {
  label:       string;
  description: string;
  checked:     boolean;
  onChange:    (v: boolean) => void;
  disabled?:   boolean;
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-200">{label}</div>
        <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-[#0d1117] ${
          checked ? 'bg-indigo-500' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

interface SliderRowProps {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  step:     number;
  unit?:    string;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step, unit, onChange }: SliderRowProps) {
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-200">{label}</span>
        <span className="text-xs font-mono text-indigo-400">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
      />
      <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function SelectRow({ label, value, options, onChange }: {
  label: string; value: number; options: number[]; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs font-medium text-gray-200">{label}</span>
      <div className="flex gap-1">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1 text-xs font-mono rounded-md border transition-colors ${
              value === opt
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPanel({ open, onClose, settings, onChange }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof EditorSettings>(key: K, val: EditorSettings[K]) => {
    onChange({ ...settings, [key]: val });
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', fn), 0);
    return () => document.removeEventListener('mousedown', fn);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full z-50 w-80 bg-[#0d1117] border-l border-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-600/20">
              <Code2 size={14} className="text-indigo-400" />
            </div>
            <span className="text-sm font-semibold text-gray-100">Editor Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">

          {/* ── Suggestions ── */}
          <SectionHeader icon={<Sparkles size={12}/>} label="IntelliSense" />

          <ToggleRow
            label="Enable Suggestions"
            description="Master toggle — turns autocomplete on or off"
            checked={settings.suggestions}
            onChange={v => set('suggestions', v)}
          />
          <ToggleRow
            label="Inline Quick Suggestions"
            description="Show suggestions while typing (not just on trigger)"
            checked={settings.quickSuggestions}
            onChange={v => set('quickSuggestions', v)}
            disabled={!settings.suggestions}
          />
          <ToggleRow
            label="Parameter Hints"
            description="Show function signatures with parameter info when typing '('"
            checked={settings.parameterHints}
            onChange={v => set('parameterHints', v)}
            disabled={!settings.suggestions}
          />
          <ToggleRow
            label="Code Snippets"
            description="Enable snippet templates (fori, bfs, dfs, dp...)"
            checked={settings.snippets}
            onChange={v => set('snippets', v)}
            disabled={!settings.suggestions}
          />

          <Divider />

          {/* ── Display ── */}
          <SectionHeader icon={<Eye size={12}/>} label="Display" />

          <ToggleRow
            label="Minimap"
            description="Show code overview in the right margin"
            checked={settings.minimap}
            onChange={v => set('minimap', v)}
          />
          <ToggleRow
            label="Word Wrap"
            description="Wrap long lines instead of horizontal scroll"
            checked={settings.wordWrap}
            onChange={v => set('wordWrap', v)}
          />
          <ToggleRow
            label="Line Numbers"
            description="Show line numbers in the gutter"
            checked={settings.lineNumbers}
            onChange={v => set('lineNumbers', v)}
          />
          <ToggleRow
            label="Bracket Pair Colorization"
            description="Color matching brackets/parentheses"
            checked={settings.bracketPairColorization}
            onChange={v => set('bracketPairColorization', v)}
          />
          <ToggleRow
            label="Render Whitespace"
            description="Show dots for spaces in selected text"
            checked={settings.renderWhitespace}
            onChange={v => set('renderWhitespace', v)}
          />

          <Divider />

          {/* ── Typography ── */}
          <SectionHeader icon={<Type size={12}/>} label="Typography" />

          <ToggleRow
            label="Font Ligatures"
            description="Enable ligatures (→, ≥, !=, etc. with JetBrains Mono)"
            checked={settings.fontLigatures}
            onChange={v => set('fontLigatures', v)}
          />
          <ToggleRow
            label="Smooth Caret Animation"
            description="Animate cursor movement"
            checked={settings.smoothCaret}
            onChange={v => set('smoothCaret', v)}
          />

          <SliderRow
            label="Font Size"
            value={settings.fontSize}
            min={10} max={20} step={1} unit="px"
            onChange={v => set('fontSize', v)}
          />

          <SelectRow
            label="Tab Size"
            value={settings.tabSize}
            options={[2, 4, 8]}
            onChange={v => set('tabSize', v)}
          />

          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800 shrink-0">
          <p className="text-[10px] text-gray-600 text-center">Settings saved automatically</p>
        </div>
      </div>
    </>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 pt-3 pb-1">
      <span className="text-indigo-400">{icon}</span>
      <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-gray-800/60 my-1" />;
}
