'use client';

/**
 * components/SettingsPanel.tsx
 * Slide-in settings panel — fully i18n via useI18n().
 */

import { useEffect, useRef } from 'react';
import { X, Sparkles, Eye, Type, Code2, Monitor, Timer } from 'lucide-react';
import { EditorSettings } from '@/lib/editor-settings';
import { useI18n } from '@/lib/i18n-context';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onChange: (s: EditorSettings) => void;
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
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
        className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-[#0d1117] ${checked ? 'bg-indigo-500' : 'bg-gray-700'
          }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'
            }`}
        />
      </button>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
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
            className={`px-3 py-1 text-xs font-mono rounded-md border transition-colors ${value === opt
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
  const { t } = useI18n();
  const st = t.settings;
  const tog = st.toggles;
  const sec = st.sections;
  const panelRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof EditorSettings>(key: K, val: EditorSettings[K]) => {
    onChange({ ...settings, [key]: val });
  };

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, onClose]);

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
      <div className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} />

      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full z-50 w-80 bg-[#0d1117] border-l border-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-600/20">
              <Code2 size={14} className="text-indigo-400" />
            </div>
            <span className="text-sm font-semibold text-gray-100">{st.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">

          {/* IntelliSense */}
          <SectionHeader icon={<Sparkles size={12} />} label={sec.intellisense} />
          <ToggleRow label={tog.suggestions.label} description={tog.suggestions.desc} checked={settings.suggestions} onChange={v => set('suggestions', v)} />
          <ToggleRow label={tog.quickSuggestions.label} description={tog.quickSuggestions.desc} checked={settings.quickSuggestions} onChange={v => set('quickSuggestions', v)} disabled={!settings.suggestions} />
          <ToggleRow label={tog.parameterHints.label} description={tog.parameterHints.desc} checked={settings.parameterHints} onChange={v => set('parameterHints', v)} disabled={!settings.suggestions} />
          <ToggleRow label={tog.snippets.label} description={tog.snippets.desc} checked={settings.snippets} onChange={v => set('snippets', v)} disabled={!settings.suggestions} />

          <Divider />

          {/* Display */}
          <SectionHeader icon={<Eye size={12} />} label={sec.display} />
          <ToggleRow label={tog.minimap.label} description={tog.minimap.desc} checked={settings.minimap} onChange={v => set('minimap', v)} />
          <ToggleRow label={tog.wordWrap.label} description={tog.wordWrap.desc} checked={settings.wordWrap} onChange={v => set('wordWrap', v)} />
          <ToggleRow label={tog.lineNumbers.label} description={tog.lineNumbers.desc} checked={settings.lineNumbers} onChange={v => set('lineNumbers', v)} />
          <ToggleRow label={tog.bracketPairColorization.label} description={tog.bracketPairColorization.desc} checked={settings.bracketPairColorization} onChange={v => set('bracketPairColorization', v)} />
          <ToggleRow label={tog.renderWhitespace.label} description={tog.renderWhitespace.desc} checked={settings.renderWhitespace} onChange={v => set('renderWhitespace', v)} />
          <ToggleRow label={tog.showWarnings.label} description={st.showWarningsDesc} checked={settings.showWarnings} onChange={v => set('showWarnings', v)} />

          <Divider />

          {/* Typography */}
          <SectionHeader icon={<Type size={12} />} label={sec.typography} />
          <ToggleRow label={tog.fontLigatures.label} description={tog.fontLigatures.desc} checked={settings.fontLigatures} onChange={v => set('fontLigatures', v)} />
          <ToggleRow label={tog.smoothCaret.label} description={tog.smoothCaret.desc} checked={settings.smoothCaret} onChange={v => set('smoothCaret', v)} />
          <SliderRow label={st.fontSize} value={settings.fontSize} min={10} max={20} step={1} unit="px" onChange={v => set('fontSize', v)} />
          <SelectRow label={st.tabSize} value={settings.tabSize} options={[2, 4, 8]} onChange={v => set('tabSize', v)} />

          <Divider />

          {/* Theme */}
          <SectionHeader icon={<Monitor size={12} />} label={sec.theme} />
          <div className="space-y-1">
            {st.themes.map(opt => (
              <button
                key={opt.value}
                onClick={() => set('theme', opt.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors ${settings.theme === opt.value
                    ? 'bg-indigo-600/20 border border-indigo-700/50'
                    : 'hover:bg-gray-800/60 border border-transparent'
                  }`}
              >
                <div>
                  <div className="text-xs font-medium text-gray-200">{opt.label}</div>
                  <div className="text-[10px] text-gray-600">{opt.desc}</div>
                </div>
                {settings.theme === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          <Divider />

          {/* Execution */}
          <SectionHeader icon={<Timer size={12} />} label={sec.execution} />
          <ToggleRow label={tog.useWasm.label} description={tog.useWasm.desc} checked={settings.useWasm} onChange={v => set('useWasm', v)} />
          <ToggleRow label={tog.realtimeLogs.label} description={tog.realtimeLogs.desc} checked={settings.realtimeLogs} onChange={v => set('realtimeLogs', v)} />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-xs text-gray-300">{st.runTimeout}</span>
                <p className="text-[10px] text-gray-600">{st.runTimeoutDesc}</p>
              </div>
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {settings.runTimeoutMs / 1000}s
              </span>
            </div>
            <div className="flex gap-1.5">
              {[5, 10, 15, 30].map(sec => (
                <button
                  key={sec}
                  onClick={() => set('runTimeoutMs', sec * 1000)}
                  className={`flex-1 py-1 text-[11px] rounded font-mono transition-colors ${settings.runTimeoutMs === sec * 1000
                      ? 'bg-indigo-600/70 text-indigo-200 font-semibold'
                      : 'bg-gray-800/60 text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800 shrink-0">
          <p className="text-[10px] text-gray-600 text-center">{st.savedAutomatically}</p>
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
