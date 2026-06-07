import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, Keyboard, FlaskConical, Lightbulb, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hướng dẫn – CppEditor',
  description: 'Hướng dẫn sử dụng CppEditor – online C++/Python compiler',
};

const NAV = [
  { href: '/guide',           icon: Code2,        label: 'Tổng quan' },
  { href: '/guide/shortcuts', icon: Keyboard,      label: 'Phím tắt' },
  { href: '/guide/testcases', icon: FlaskConical,  label: 'Test Cases' },
  { href: '/guide/tips',      icon: Lightbulb,     label: 'CP Tips' },
];

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0c14] text-gray-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 min-h-screen border-r border-[#1f1f32] bg-[#0e0e1a] sticky top-0 h-screen overflow-y-auto">
          <div className="p-4 border-b border-[#1f1f32]">
            <Link href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm">
              <ArrowLeft size={14}/> Về Editor
            </Link>
          </div>
          <nav className="p-3 space-y-0.5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest px-3 py-2">Hướng dẫn</p>
            {NAV.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800/50 transition-colors"
              >
                <Icon size={14} className="shrink-0 text-indigo-400" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 max-w-3xl px-10 py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
