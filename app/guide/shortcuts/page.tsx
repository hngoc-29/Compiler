'use client';

import { Keyboard } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export default function ShortcutsPage() {
  const { t } = useI18n();
  const sp = t.shortcutsPage;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Keyboard size={22} className="text-violet-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-100">{sp.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {sp.subtitle.split('?')[0]}<Kbd>?</Kbd>{sp.subtitle.split('?')[1]}
          </p>
        </div>
      </div>

      {sp.sections.map(section => (
        <div key={section.title}>
          <h2 className={`text-sm font-semibold mb-3 ${section.color}`}>{section.title}</h2>
          <div className="rounded-xl border border-[#1f1f32] overflow-hidden">
            {section.items.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  i < section.items.length - 1 ? 'border-b border-[#1f1f32]' : ''
                } ${i % 2 === 0 ? 'bg-[#0e0e1a]' : 'bg-[#0c0c14]'}`}
              >
                <span className="text-gray-300">{item.desc}</span>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  {item.keys.map((k, ki) => (
                    <span key={ki} className="flex items-center gap-1">
                      {ki > 0 && <span className="text-gray-700 text-[10px]">+</span>}
                      <Kbd>{k}</Kbd>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-xl bg-blue-950/30 border border-blue-800/30 p-4 text-sm text-gray-400">
        <strong className="text-blue-300">{sp.tipLabel}</strong> {sp.tip.split('Command Palette')[0]}
        <strong>Command Palette</strong> (<Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>P</Kbd>){sp.tip.split('Command Palette')[1].replace(/\(Ctrl\+Shift\+P\)\s*/, '')}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-300 rounded border border-gray-700 font-mono leading-4 whitespace-nowrap">
      {children}
    </kbd>
  );
}
