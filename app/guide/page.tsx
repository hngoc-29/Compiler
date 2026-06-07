'use client';

import Link from 'next/link';
import { Keyboard, FlaskConical, Lightbulb, ArrowRight, Zap, Share2, Settings2, Code2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

const CARD_META = [
  { href: '/guide/shortcuts', icon: Keyboard,     color: 'text-violet-400',  bg: 'bg-violet-950/30 border-violet-800/30' },
  { href: '/guide/testcases', icon: FlaskConical,  color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-800/30' },
  { href: '/guide/tips',      icon: Lightbulb,     color: 'text-yellow-400',  bg: 'bg-yellow-950/30 border-yellow-800/30' },
];

const FEATURE_ICONS = [Zap, FlaskConical, Share2, Code2, Settings2];

type StepPart = string | { tag: 'link' | 'code' | 'kbd' | 'em'; text: string };

function renderStepPart(part: StepPart, idx: number) {
  if (typeof part === 'string') return <span key={idx}>{part}</span>;
  switch (part.tag) {
    case 'link': return <Link key={idx} href="/" className="text-indigo-400 underline hover:text-indigo-300">{part.text}</Link>;
    case 'code': return <span key={idx} className="text-green-400 font-mono">{part.text}</span>;
    case 'kbd':  return <Kbd key={idx}>{part.text}</Kbd>;
    case 'em':   return <span key={idx} className="text-indigo-400">{part.text}</span>;
  }
}

export default function GuidePage() {
  const { t } = useI18n();
  const ov = t.overview;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">{ov.title}</h1>
        <p className="text-gray-400 text-sm leading-relaxed">{ov.subtitle}</p>
      </div>

      {/* Cards */}
      <div className="grid gap-4">
        {CARD_META.map(({ href, icon: Icon, color, bg }, i) => {
          const card = ov.cards[i];
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-start gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${bg}`}
            >
              <div className={`shrink-0 mt-0.5 ${color}`}><Icon size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-100 mb-1">{card.title}</div>
                <div className="text-sm text-gray-400">{card.desc}</div>
              </div>
              <ArrowRight size={16} className="shrink-0 text-gray-600 mt-1 group-hover:text-gray-400 transition-colors" />
            </Link>
          );
        })}
      </div>

      {/* Feature highlights */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
          {ov.featuresTitle}
        </h2>
        <div className="space-y-3">
          {ov.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div key={f.title} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 text-indigo-400"><Icon size={15} /></div>
                <div>
                  <span className="text-sm font-medium text-gray-200">{f.title}</span>
                  <span className="text-sm text-gray-500"> — {f.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick start */}
      <div className="rounded-xl bg-indigo-950/30 border border-indigo-800/30 p-5">
        <h2 className="text-sm font-semibold text-indigo-300 mb-3">{ov.quickStartTitle}</h2>
        <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
          {ov.quickStartSteps.map((step, i) => (
            <li key={i}>{step.map((part, j) => renderStepPart(part as StepPart, j))}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 px-1.5 py-0.5 text-[11px] bg-gray-800 text-gray-300 rounded border border-gray-700">
      {children}
    </kbd>
  );
}
