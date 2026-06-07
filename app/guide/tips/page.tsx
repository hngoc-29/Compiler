import { Lightbulb, Code2, Zap, Clock, LibrarySquare } from 'lucide-react';

export default function TipsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Lightbulb size={22} className="text-yellow-400"/>
        <div>
          <h1 className="text-xl font-bold text-gray-100">CP Tips & Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mẹo và template cho Competitive Programming.</p>
        </div>
      </div>

      {/* Templates panel */}
      <Section title="📚 Dùng Templates Panel">
        <p>Click icon <span className="inline-flex items-center gap-1 bg-gray-800 px-1.5 py-0.5 rounded text-indigo-400 text-xs"><LibrarySquare size={11}/> Templates</span> trên thanh pane bar của code editor.</p>
        <p className="text-gray-400">Panel trượt ra từ trái — tìm kiếm, chọn template và click <strong className="text-indigo-300">Chèn vào Editor</strong>.</p>
        <p className="text-gray-400">Templates có sẵn:</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            'Fast I/O (multi-test)', 'Binary Search',
            'BFS', 'DFS',
            'Dijkstra', 'DSU / Union-Find',
            'Fenwick Tree (BIT)', 'Segment Tree',
            'Sieve of Eratosthenes', 'Modular Arithmetic',
            'Python Fast I/O', 'Python BFS',
          ].map(t => (
            <div key={t} className="text-xs bg-gray-800/50 rounded px-2 py-1.5 text-gray-300">
              {t}
            </div>
          ))}
        </div>
      </Section>

      {/* Fast I/O */}
      <Section title="⚡ Fast I/O — luôn thêm vào đầu main()">
        <Code>{`ios_base::sync_with_stdio(false);
cin.tie(NULL);`}</Code>
        <p className="text-gray-400">Tắt sync giữa C stdio và C++ streams. Bắt buộc khi dùng <code className="text-yellow-400">cin/cout</code> với input lớn — không ảnh hưởng đến tính đúng của kết quả.</p>
      </Section>

      {/* Common tricks */}
      <Section title="🔧 Tricks hay dùng">
        <div className="space-y-4">
          <Trick title="Đọc input nhanh">
            <Code>{`int n; cin >> n;
vector<int> a(n);
for (auto& x : a) cin >> x;`}</Code>
          </Trick>
          <Trick title="Output nhanh — '\n' thay vì endl">
            <Code>{`// endl flush buffer → chậm hơn 10–100x
cout << ans << '\\n';   // ✓ Nhanh
cout << ans << endl;  // ✗ Chậm`}</Code>
          </Trick>
          <Trick title="Pair và tuple">
            <Code>{`pair<int,int> p = {3, 5};
auto [x, y] = p;          // C++17 structured binding

tuple<int,int,int> t = {1, 2, 3};
auto [a, b, c] = t;`}</Code>
          </Trick>
          <Trick title="Lambda comparator cho sort">
            <Code>{`// Sort theo giá trị thứ 2 giảm dần
sort(v.begin(), v.end(), [](auto& a, auto& b) {
    return a.second > b.second;
});`}</Code>
          </Trick>
          <Trick title="GCD / LCM (C++17)">
            <Code>{`#include <numeric>
int g = __gcd(a, b);          // C++11
int g2 = gcd(a, b);           // C++17
int l = a / gcd(a, b) * b;   // LCM`}</Code>
          </Trick>
          <Trick title="Bit tricks">
            <Code>{`int lowbit = x & (-x);          // bit thấp nhất
int popcount = __builtin_popcount(x); // số bit 1
bool isPow2 = x && !(x & (x-1));
int log2floor = 31 - __builtin_clz(x); // floor(log2(x))`}</Code>
          </Trick>
        </div>
      </Section>

      {/* Timeout tips */}
      <Section title="⏱️ Tối ưu khi bị TLE">
        <div className="space-y-2 text-sm text-gray-400">
          <p>• Bật <strong className="text-gray-200">-O2 optimize</strong> trong header (toggle ở header bar) — tăng tốc 2–5x.</p>
          <p>• Dùng <code className="text-yellow-400">printf/scanf</code> nếu vẫn chậm sau fast I/O.</p>
          <p>• Tránh <code className="text-yellow-400">endl</code>, dùng <code className="text-yellow-400">&apos;\n&apos;</code>.</p>
          <p>• <code className="text-yellow-400">reserve()</code> cho <code className="text-yellow-400">vector</code> nếu biết trước kích thước.</p>
          <p>• Dùng <code className="text-yellow-400">unordered_map</code> thay <code className="text-yellow-400">map</code> khi không cần thứ tự (O(1) vs O(log n)).</p>
          <p>• Tăng timeout trong Settings nếu cần kiểm thử giải pháp chậm.</p>
        </div>
      </Section>

      {/* Complexity */}
      <Section title="📊 Ước tính Complexity">
        <div className="rounded-xl border border-[#1f1f32] overflow-hidden text-sm">
          {[
            { n: '10⁸ operations', time: '~1s', note: 'Giới hạn thông thường của OJ' },
            { n: 'n ≤ 10⁶',        time: 'O(n log n)', note: 'Sort, BIT, Segment tree' },
            { n: 'n ≤ 10⁵',        time: 'O(n log²n)', note: 'Merge sort tree, offline' },
            { n: 'n ≤ 5000',       time: 'O(n²)',       note: 'DP 2D cơ bản' },
            { n: 'n ≤ 500',        time: 'O(n³)',       note: 'Floyd-Warshall, matrix chain' },
            { n: 'n ≤ 20',         time: 'O(2ⁿ)',       note: 'Bitmask DP' },
          ].map((row, i) => (
            <div key={i} className={`flex items-center px-4 py-2.5 border-b border-[#1f1f32] last:border-0 ${i % 2 === 0 ? 'bg-[#0e0e1a]' : 'bg-[#0c0c14]'}`}>
              <span className="w-36 font-mono text-yellow-400 text-xs shrink-0">{row.n}</span>
              <span className="w-28 font-mono text-indigo-400 text-xs shrink-0">{row.time}</span>
              <span className="text-gray-500 text-xs">{row.note}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* IntelliSense */}
      <Section title="🤖 IntelliSense cho hàm tự viết">
        <p>Editor tự động nhận diện các hàm bạn viết và cung cấp:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
          <li><strong className="text-gray-200">Autocomplete</strong> — gõ tên hàm, dropdown gợi ý xuất hiện</li>
          <li><strong className="text-gray-200">Parameter hints</strong> — gõ <code className="text-yellow-400">funcName(</code>, tooltip hiện tên từng tham số</li>
          <li>Ký tự hoạt động với mọi ngôn ngữ: C++, C, Python</li>
        </ul>
        <Code>{`// Viết hàm này → gọi solve() sẽ có gợi ý
void solve(int n, vector<int>& a) {
    // ...
}
// Khi gõ: solve( → tooltip: solve(int n, vector<int>& a)`}</Code>
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
