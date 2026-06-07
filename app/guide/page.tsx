import Link from 'next/link';
import { Keyboard, FlaskConical, Lightbulb, ArrowRight, Zap, Share2, Settings2, Code2 } from 'lucide-react';

const CARDS = [
  {
    href: '/guide/shortcuts',
    icon: Keyboard,
    color: 'text-violet-400',
    bg: 'bg-violet-950/30 border-violet-800/30',
    title: 'Phím tắt',
    desc: 'Ctrl+Enter, Ctrl+Shift+F, ? và tất cả shortcuts để code nhanh hơn.',
  },
  {
    href: '/guide/testcases',
    icon: FlaskConical,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/30 border-emerald-800/30',
    title: 'Test Cases',
    desc: 'Tạo, chạy, export/import bộ test — workflow kiểm thử như một pro.',
  },
  {
    href: '/guide/tips',
    icon: Lightbulb,
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/30 border-yellow-800/30',
    title: 'CP Tips & Templates',
    desc: 'Templates DSU, Segment tree, Dijkstra — chèn 1 click vào editor.',
  },
];

const FEATURES = [
  { icon: Zap,      title: 'Compile & Run nhanh',    desc: 'WebSocket streaming — output hiện ngay từng dòng, không cần chờ.' },
  { icon: FlaskConical, title: 'Test Case engine', desc: 'Chấm Pass/Fail tự động, so sánh expected output, chạy song song.' },
  { icon: Share2,   title: 'Share link',              desc: 'Chia sẻ code + input qua URL ngắn — ai mở cũng thấy đúng như bạn.' },
  { icon: Code2,    title: 'IntelliSense đầy đủ',    desc: 'Gợi ý hàm tự định nghĩa, parameter hints, STL completions.' },
  { icon: Settings2, title: 'Tuỳ chỉnh sâu',        desc: 'Font, theme, timeout, warnings, IntelliSense — tất cả trong Settings.' },
];

export default function GuidePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Hướng dẫn CppEditor</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Online compiler hỗ trợ C++20, C++17, C11 và Python 3 — tối ưu cho Competitive Programming.
          Chọn một chủ đề bên dưới để bắt đầu.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4">
        {CARDS.map(({ href, icon: Icon, color, bg, title, desc }) => (
          <Link
            key={href}
            href={href}
            className={`group flex items-start gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${bg}`}
          >
            <div className={`shrink-0 mt-0.5 ${color}`}><Icon size={20}/></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-100 mb-1">{title}</div>
              <div className="text-sm text-gray-400">{desc}</div>
            </div>
            <ArrowRight size={16} className="shrink-0 text-gray-600 mt-1 group-hover:text-gray-400 transition-colors"/>
          </Link>
        ))}
      </div>

      {/* Feature highlights */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Tính năng nổi bật</h2>
        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 text-indigo-400"><Icon size={15}/></div>
              <div>
                <span className="text-sm font-medium text-gray-200">{title}</span>
                <span className="text-sm text-gray-500"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick start */}
      <div className="rounded-xl bg-indigo-950/30 border border-indigo-800/30 p-5">
        <h2 className="text-sm font-semibold text-indigo-300 mb-3">⚡ Quick Start</h2>
        <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
          <li>Mở <Link href="/" className="text-indigo-400 underline hover:text-indigo-300">trang chính</Link>, chọn ngôn ngữ trên góc phải.</li>
          <li>Gõ code vào panel <span className="text-green-400 font-mono">main.cpp</span> bên trái.</li>
          <li>Nhấn <Kbd>Ctrl+Enter</Kbd> hoặc nút <span className="text-indigo-400">▶ Run</span> để chạy.</li>
          <li>Xem kết quả ở panel <span className="text-red-400 font-mono">Output</span> bên phải.</li>
          <li>Mở tab <span className="text-yellow-400">Test Cases</span> để tạo bộ test và chấm tự động.</li>
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
