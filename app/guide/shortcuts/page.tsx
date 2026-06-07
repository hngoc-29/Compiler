import { Keyboard } from 'lucide-react';

const SECTIONS = [
  {
    title: '▶ Chạy code',
    color: 'text-indigo-400',
    items: [
      { keys: ['Ctrl', 'Enter'],      desc: 'Compile & Run — hoặc "Run All" nếu đang ở tab Test Cases' },
      { keys: ['Ctrl', 'Shift', 'F'], desc: 'Format (đẹp) toàn bộ code tự động' },
    ],
  },
  {
    title: '✏️ Soạn thảo',
    color: 'text-emerald-400',
    items: [
      { keys: ['Ctrl', 'Z'],          desc: 'Undo' },
      { keys: ['Ctrl', 'Y'],          desc: 'Redo  (hoặc Ctrl+Shift+Z)' },
      { keys: ['Ctrl', 'D'],          desc: 'Duplicate dòng hiện tại xuống dưới' },
      { keys: ['Ctrl', '/'],          desc: 'Comment / Uncomment dòng (//...)' },
      { keys: ['Alt', '↑ / ↓'],       desc: 'Di chuyển nguyên dòng lên / xuống' },
      { keys: ['Ctrl', 'Shift', 'K'], desc: 'Xóa dòng hiện tại' },
      { keys: ['Ctrl', 'G'],          desc: 'Nhảy đến dòng số...' },
      { keys: ['Tab'],                desc: 'Indent — trong Input area: chèn 2 spaces' },
      { keys: ['Shift', 'Tab'],       desc: 'Unindent' },
    ],
  },
  {
    title: '🔍 Tìm kiếm',
    color: 'text-yellow-400',
    items: [
      { keys: ['Ctrl', 'F'],          desc: 'Mở thanh tìm kiếm trong code' },
      { keys: ['Ctrl', 'H'],          desc: 'Tìm và thay thế (Find & Replace)' },
      { keys: ['Ctrl', 'Shift', 'P'], desc: 'Command Palette — tìm mọi lệnh Monaco' },
    ],
  },
  {
    title: '🖥️ Giao diện',
    color: 'text-violet-400',
    items: [
      { keys: ['?'],                  desc: 'Mở / đóng modal phím tắt này' },
      { keys: ['Esc'],                desc: 'Đóng modal / panel đang mở' },
    ],
  },
  {
    title: '📱 Mobile (chạm)',
    color: 'text-orange-400',
    items: [
      { keys: ['Long press (giữ)'],   desc: 'Chọn từ dưới ngón tay, kéo để mở rộng vùng chọn' },
      { keys: ['Nút Copy (toolbar)'], desc: 'Copy toàn bộ code, hoặc copy vùng đã chọn' },
    ],
  },
];

export default function ShortcutsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Keyboard size={22} className="text-violet-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-100">Keyboard Shortcuts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Nhấn <Kbd>?</Kbd> bất kỳ lúc nào trong editor để xem nhanh danh sách này.
          </p>
        </div>
      </div>

      {SECTIONS.map(section => (
        <div key={section.title}>
          <h2 className={`text-sm font-semibold mb-3 ${section.color}`}>{section.title}</h2>
          <div className="rounded-xl border border-[#1f1f32] overflow-hidden">
            {section.items.map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${
                i < section.items.length - 1 ? 'border-b border-[#1f1f32]' : ''
              } ${i % 2 === 0 ? 'bg-[#0e0e1a]' : 'bg-[#0c0c14]'}`}>
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
        <strong className="text-blue-300">Mẹo:</strong> Monaco Editor hỗ trợ hầu hết phím tắt của VS Code.
        Mở <strong>Command Palette</strong> (<Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>P</Kbd>) để tìm thêm lệnh.
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
