'use client';

import { Lightbulb, LibrarySquare } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

/* Code snippets are language-agnostic — kept in component, titles come from i18n */
const TRICK_CODES = [
  `int n; cin >> n;\nvector<int> a(n);\nfor (auto& x : a) cin >> x;`,
  `// endl flush buffer → slow 10–100x\ncout << ans << '\\n';   // ✓ Fast\ncout << ans << endl;  // ✗ Slow`,
  `pair<int,int> p = {3, 5};\nauto [x, y] = p;          // C++17 structured binding\n\ntuple<int,int,int> t = {1, 2, 3};\nauto [a, b, c] = t;`,
  `// Sort by second value descending\nsort(v.begin(), v.end(), [](auto& a, auto& b) {\n    return a.second > b.second;\n});`,
  `#include <numeric>\nint g = __gcd(a, b);          // C++11\nint g2 = gcd(a, b);           // C++17\nint l = a / gcd(a, b) * b;   // LCM`,
  `int lowbit = x & (-x);          // lowest set bit\nint popcount = __builtin_popcount(x);\nbool isPow2 = x && !(x & (x-1));\nint log2floor = 31 - __builtin_clz(x);`,
];

const TEMPLATE_NAMES = [
  'Fast I/O (multi-test)', 'Binary Search',
  'BFS', 'DFS',
  'Dijkstra', 'DSU / Union-Find',
  'Fenwick Tree (BIT)', 'Segment Tree',
  'Sieve of Eratosthenes', 'Modular Arithmetic',
  'Python Fast I/O', 'Python BFS',
];

export default function TipsPage() {
  const { t } = useI18n();
  const tp = t.tipsPage;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Lightbulb size={22} className="text-yellow-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-100">{tp.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tp.subtitle}</p>
        </div>
      </div>

      {/* Templates Panel */}
      <Section title={tp.s1.title}>
        <p>
          {tp.s1.paras[0].split('Templates')[0]}
          <span className="inline-flex items-center gap-1 bg-gray-800 px-1.5 py-0.5 rounded text-indigo-400 text-xs">
            <LibrarySquare size={11} /> Templates
          </span>
          {tp.s1.paras[0].split('Templates')[1]}
        </p>
        <p className="text-gray-400">
          {tp.s1.paras[1].split(tp.s1.insertLabel)[0]}
          <strong className="text-indigo-300">{tp.s1.insertLabel}</strong>
          {tp.s1.paras[1].split(tp.s1.insertLabel)[1]}
        </p>
        <p className="text-gray-400">{tp.s1.paras[2]}</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {TEMPLATE_NAMES.map(name => (
            <div key={name} className="text-xs bg-gray-800/50 rounded px-2 py-1.5 text-gray-300">{name}</div>
          ))}
        </div>
      </Section>

      {/* Fast I/O */}
      <Section title={tp.s2.title}>
        <Code>{`ios_base::sync_with_stdio(false);\ncin.tie(NULL);`}</Code>
        <p className="text-gray-400">{tp.s2.desc}</p>
      </Section>

      {/* Common tricks */}
      <Section title={tp.s3.title}>
        <div className="space-y-4">
          {tp.s3.tricks.map((trick, i) => (
            <Trick key={trick.title} title={trick.title}>
              <Code>{TRICK_CODES[i]}</Code>
            </Trick>
          ))}
        </div>
      </Section>

      {/* TLE tips */}
      <Section title={tp.s4.title}>
        <div className="space-y-2 text-sm text-gray-400">
          {tp.s4.tips.map((tip, i) => <p key={i}>• {tip}</p>)}
        </div>
      </Section>

      {/* Complexity */}
      <Section title={tp.s5.title}>
        <div className="rounded-xl border border-[#1f1f32] overflow-hidden text-sm">
          {tp.s5.rows.map((row, i) => (
            <div
              key={i}
              className={`flex items-center px-4 py-2.5 border-b border-[#1f1f32] last:border-0 ${
                i % 2 === 0 ? 'bg-[#0e0e1a]' : 'bg-[#0c0c14]'
              }`}
            >
              <span className="w-36 font-mono text-yellow-400 text-xs shrink-0">{row.n}</span>
              <span className="w-28 font-mono text-indigo-400 text-xs shrink-0">{row.time}</span>
              <span className="text-gray-500 text-xs">{row.note}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* IntelliSense */}
      <Section title={tp.s6.title}>
        {tp.s6.paras.map((p, i) => <p key={i}>{p}</p>)}
        <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
          {tp.s6.features.map((f, i) =>
            f.note
              ? <li key={i}>{f.note}</li>
              : <li key={i}><strong className="text-gray-200">{f.label}</strong>{f.desc}</li>
          )}
        </ul>
        <Code>{`// Write this function → calling solve() will have suggestions\nvoid solve(int n, vector<int>& a) {\n    // ...\n}\n// When typing: solve( → tooltip: solve(int n, vector<int>& a)`}</Code>
      </Section>
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

function Trick({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-gray-300 font-medium mb-1.5">{title}</p>
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-900/60 border border-gray-800 rounded-lg px-4 py-3 text-xs text-emerald-300 overflow-x-auto leading-relaxed font-mono">
      {children}
    </pre>
  );
}
