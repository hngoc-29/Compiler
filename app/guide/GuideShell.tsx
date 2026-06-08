'use client';

/**
 * app/guide/GuideShell.tsx
 * Client shell for the guide section — sidebar + language selector.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, Keyboard, FlaskConical, Lightbulb, ArrowLeft } from 'lucide-react';
import { I18nProvider, useI18n } from '@/lib/i18n-context';
import LangSelect from '@/components/LangSelect';

const NAV_ICONS = [Code2, Keyboard, FlaskConical, Lightbulb];
const NAV_HREFS = ['/guide', '/guide/shortcuts', '/guide/testcases', '/guide/tips'];

function GuideSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();

  const navItems = [
    t.guide.overview,
    t.guide.shortcuts,
    t.guide.testCases,
    t.guide.cpTips,
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-[#1f1f32] bg-[#0e0e1a] h-full flex flex-col overflow-y-auto">
      {/* Back */}
      <div className="p-4 border-b border-[#1f1f32] shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
        >
          <ArrowLeft size={14} /> {t.guide.backToEditor}
        </Link>
      </div>

      {/* Nav */}
      <nav className="p-3 space-y-0.5 flex-1">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest px-3 py-2">
          {t.guide.navLabel}
        </p>
        {NAV_HREFS.map((href, i) => {
          const Icon  = NAV_ICONS[i];
          const label = navItems[i];
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors ${
                active
                  ? 'text-gray-100 bg-indigo-600/20 border border-indigo-700/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
              }`}
            >
              <Icon size={14} className={`shrink-0 ${active ? 'text-indigo-300' : 'text-indigo-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Language selector — auto-shows all languages from SUPPORTED_LANGS */}
      <div className="p-3 border-t border-[#1f1f32] shrink-0">
        <LangSelect variant="sidebar" />
      </div>
    </aside>
  );
}

function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="h-screen overflow-hidden bg-[#0c0c14] text-gray-200 flex"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <GuideSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl px-10 py-10">{children}</div>
      </main>
    </div>
  );
}

export default function GuideShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <GuideLayout>{children}</GuideLayout>
    </I18nProvider>
  );
}
