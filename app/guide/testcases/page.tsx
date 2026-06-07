import { FlaskConical, Plus, Play, Download, Upload, RotateCcw, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function TestCasesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <FlaskConical size={22} className="text-emerald-400"/>
        <div>
          <h1 className="text-xl font-bold text-gray-100">Test Cases</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tạo bộ test, chấm Pass/Fail tự động, export/import.</p>
        </div>
      </div>

      {/* Switch to Test Cases tab */}
      <Section title="1. Chuyển sang chế độ Test Cases">
        <p>Ở góc trên trái header, click tab <Tag color="yellow">Test Cases</Tag> (hoặc giữ <Kbd>Ctrl+Enter</Kbd> sẽ chạy tất cả test).</p>
        <p>Panel bên phải chuyển thành danh sách test cases với status badge.</p>
      </Section>

      {/* Add test case */}
      <Section title="2. Thêm test case">
        <p>Click nút <Btn icon={<Plus size={11}/>}>Add</Btn> trên thanh header của panel Test Cases.</p>
        <p>Modal mở ra, điền:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
          <li><strong className="text-gray-200">Label</strong> — tên test (vd: &quot;Test 1 - Small&quot;)</li>
          <li><strong className="text-gray-200">Input (stdin)</strong> — nội dung sẽ được pipe vào chương trình</li>
          <li><strong className="text-gray-200">Expected Output</strong> — kết quả mong đợi để chấm Pass/Fail</li>
        </ul>
        <Note>Nếu bỏ trống Expected Output, test case vẫn chạy được nhưng luôn hiển thị ✓ (không chấm).</Note>
      </Section>

      {/* Run */}
      <Section title="3. Chạy test">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Btn icon={<Play size={11}/>} color="indigo">Run All</Btn>
            <span className="text-gray-400 text-sm">Chạy toàn bộ test cases song song. Kết quả hiện ngay.</span>
          </div>
          <div className="flex items-start gap-3">
            <Btn icon={<Play size={11}/>}>▶</Btn>
            <span className="text-gray-400 text-sm">Icon ▶ nhỏ trong mỗi test card — chạy đúng test đó.</span>
          </div>
          <div className="flex items-start gap-3">
            <Btn icon={<RotateCcw size={11}/>}>Reset</Btn>
            <span className="text-gray-400 text-sm">Xóa tất cả kết quả, đưa về trạng thái idle (hiện sau khi Run).</span>
          </div>
        </div>
      </Section>

      {/* Status badges */}
      <Section title="4. Đọc kết quả">
        <div className="space-y-2 text-sm">
          {[
            { icon: <CheckCircle size={13} className="text-green-400"/>, color: 'text-green-400', label: 'Pass', desc: 'Output khớp với Expected (bỏ qua trailing whitespace).' },
            { icon: <XCircle    size={13} className="text-red-400"/>,   color: 'text-red-400',   label: 'Fail', desc: 'Output khác Expected — click vào card để xem diff.' },
            { icon: <XCircle    size={13} className="text-orange-400"/>, color: 'text-orange-400', label: 'Error', desc: 'Compile error hoặc runtime error (exit code ≠ 0).' },
            { icon: <Clock      size={13} className="text-yellow-400"/>, color: 'text-yellow-400', label: 'Timeout', desc: 'Chương trình chạy quá thời gian giới hạn.' },
          ].map(s => (
            <div key={s.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
              {s.icon}
              <div>
                <span className={`font-semibold ${s.color}`}>{s.label}</span>
                <span className="text-gray-400"> — {s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Duplicate */}
      <Section title="5. Duplicate test case">
        <p>Click icon <Btn icon={<Copy size={10}/>}>Copy</Btn> trong card để tạo bản sao ngay bên dưới.</p>
        <p className="text-gray-400">Hữu ích khi muốn tạo nhiều test tương tự (chỉ đổi input nhỏ).</p>
      </Section>

      {/* Export / Import */}
      <Section title="6. Export / Import bộ test">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Btn icon={<Download size={11}/>}>↓</Btn>
            <div>
              <p className="text-sm text-gray-300 font-medium">Export — tải xuống file <code className="text-yellow-400">testcases.json</code></p>
              <p className="text-sm text-gray-500">Format JSON sạch, không có ID, dễ chỉnh tay hoặc generate script.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Btn icon={<Upload size={11}/>}>↑</Btn>
            <div>
              <p className="text-sm text-gray-300 font-medium">Import — chọn file <code className="text-yellow-400">.json</code> từ máy</p>
              <p className="text-sm text-gray-500">Tải bộ test vào, thay thế toàn bộ test hiện tại. ID được tạo mới.</p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-gray-900/60 border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold">Format file JSON:</p>
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
        <strong className="text-emerald-300">Pro tip:</strong> Dùng script Python để generate bộ test lớn → export JSON → import vào editor.
        Mỗi test case là 1 object với 3 field: <code className="text-yellow-400">label</code>, <code className="text-yellow-400">input</code>, <code className="text-yellow-400">expectedOutput</code>.
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

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/40',
    indigo: 'bg-indigo-900/40 text-indigo-300 border-indigo-800/40',
  };
  return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] border ${colors[color]}`}>{children}</span>;
}

function Btn({ children, icon, color = 'gray' }: { children?: React.ReactNode; icon?: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray:  'bg-gray-800/60 text-gray-400 border-gray-700',
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

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-300 rounded border border-gray-700 font-mono">{children}</kbd>;
}
