'use client';

import { FlaskConical, Plus, Play, Download, Upload, RotateCcw, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export default function TestCasesPage() {
  const { t } = useI18n();
  const tc = t.testCasesPage;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <FlaskConical size={22} className="text-emerald-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-100">{tc.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tc.subtitle}</p>
        </div>
      </div>

      {/* 1. Switch mode */}
      <Section title={tc.s1.title}>
        {tc.s1.paras.map((p, i) => <p key={i}>{p}</p>)}
      </Section>

      {/* 2. Add test case */}
      <Section title={tc.s2.title}>
        {tc.s2.paras.map((p, i) => <p key={i}>{p}</p>)}
        <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
          {tc.s2.fields.map(f => (
            <li key={f.name}><strong className="text-gray-200">{f.name}</strong> — {f.desc}</li>
          ))}
        </ul>
        <Note>{tc.s2.note}</Note>
      </Section>

      {/* 3. Run */}
      <Section title={tc.s3.title}>
        <div className="space-y-2">
          {tc.s3.actions.map(({ label, desc }, i) => {
            const Icon = [Play, Play, RotateCcw][i];
            const color = i === 0 ? 'indigo' : 'gray';
            return (
              <div key={label} className="flex items-start gap-3">
                <Btn icon={<Icon size={11} />} color={color as 'gray' | 'indigo'}>{label}</Btn>
                <span className="text-gray-400 text-sm">{desc}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 4. Results */}
      <Section title={tc.s4.title}>
        <div className="space-y-2 text-sm">
          {tc.s4.statuses.map(s => {
            const Icon = { 'text-green-400': CheckCircle, 'text-red-400': XCircle, 'text-orange-400': XCircle, 'text-yellow-400': Clock }[s.color] ?? CheckCircle;
            return (
              <div key={s.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
                <Icon size={13} className={s.color} />
                <div>
                  <span className={`font-semibold ${s.color}`}>{s.label}</span>
                  <span className="text-gray-400"> — {s.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 5. Duplicate */}
      <Section title={tc.s5.title}>
        {tc.s5.paras.map((p, i) => <p key={i} className={i > 0 ? 'text-gray-400' : ''}>{p}</p>)}
      </Section>

      {/* 6. Export / Import */}
      <Section title={tc.s6.title}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Btn icon={<Download size={11} />}>↓</Btn>
            <div>
              <p className="text-sm text-gray-300 font-medium">{tc.s6.export.label.split(' — ')[0]} — <code className="text-yellow-400">testcases.json</code></p>
              <p className="text-sm text-gray-500">{tc.s6.export.desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Btn icon={<Upload size={11} />}>↑</Btn>
            <div>
              <p className="text-sm text-gray-300 font-medium">{tc.s6.import.label.split('.json')[0]}<code className="text-yellow-400">.json</code>{tc.s6.import.label.split('.json')[1]}</p>
              <p className="text-sm text-gray-500">{tc.s6.import.desc}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-gray-900/60 border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold">{tc.s6.formatLabel}</p>
          <pre className="text-xs text-emerald-300 leading-relaxed">{`[
  {
    "label": "Test 1 - Basic",
    "input": "5\\n1 2 3 4 5\\n",
    "expectedOutput": "15"
  },
  {
    "label": "Test 2 - Edge",
    "input": "1\\n0\\n",
    "expectedOutput": "0"
  }
]`}</pre>
        </div>
      </Section>

      <div className="rounded-xl bg-emerald-950/30 border border-emerald-800/30 p-4 text-sm text-gray-400">
        <strong className="text-emerald-300">Pro tip:</strong> {tc.proTip.replace('Pro tip: ', '')}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-300 border-b border-[#1f1f32] pb-2">{title}</h2>
      <div className="text-sm text-gray-300 space-y-2 leading-relaxed">{children}</div>
    </div>
  );
}

function Btn({ children, icon, color = 'gray' }: { children?: React.ReactNode; icon?: React.ReactNode; color?: 'gray' | 'indigo' }) {
  const colors = {
    gray:   'bg-gray-800/60 text-gray-400 border-gray-700',
    indigo: 'bg-indigo-600/70 text-indigo-200 border-indigo-700/50',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] border font-medium shrink-0 ${colors[color]}`}>
      {icon}{children}
    </span>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-blue-400/80 bg-blue-950/20 border border-blue-900/30 rounded px-3 py-2">{children}</p>;
}
