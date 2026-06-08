/**
 * lib/i18n/vi.ts — Tiếng Việt
 */
import type { Translations } from './types';

export const vi: Translations = {

  guide: {
    navLabel:     'Hướng dẫn',
    backToEditor: '← Về Editor',
    overview:     'Tổng quan',
    shortcuts:    'Phím tắt',
    testCases:    'Test Cases',
    cpTips:       'CP Tips',
  },

  overview: {
    title:    'Hướng dẫn CppEditor',
    subtitle: 'Online compiler hỗ trợ C++20, C++17, C11 và Python 3 — tối ưu cho Competitive Programming. Chọn một chủ đề bên dưới để bắt đầu.',
    cards: [
      { title: 'Phím tắt',          desc: 'Ctrl+Enter, Ctrl+Shift+F, ? và tất cả shortcuts để code nhanh hơn.' },
      { title: 'Test Cases',        desc: 'Tạo, chạy, export/import bộ test — workflow kiểm thử như một pro.' },
      { title: 'CP Tips & Templates', desc: 'Templates DSU, Segment tree, Dijkstra — chèn 1 click vào editor.' },
    ],
    featuresTitle: 'Tính năng nổi bật',
    features: [
      { title: 'Compile & Run nhanh', desc: 'WebSocket streaming — output hiện ngay từng dòng, không cần chờ.' },
      { title: 'Test Case engine',    desc: 'Chấm Pass/Fail tự động, so sánh expected output, chạy song song.' },
      { title: 'Share link',          desc: 'Chia sẻ code + input qua URL ngắn — ai mở cũng thấy đúng như bạn.' },
      { title: 'IntelliSense đầy đủ', desc: 'Gợi ý hàm tự định nghĩa, parameter hints, STL completions.' },
      { title: 'Tuỳ chỉnh sâu',      desc: 'Font, theme, timeout, warnings, IntelliSense — tất cả trong Settings.' },
    ],
    quickStartTitle: '⚡ Quick Start',
    quickStartSteps: [
      ['Mở ', { tag: 'link', text: 'trang chính' }, ', chọn ngôn ngữ trên góc phải.'],
      ['Gõ code vào panel ', { tag: 'code', text: 'main.cpp' }, ' bên trái.'],
      ['Nhấn ', { tag: 'kbd',  text: 'Ctrl+Enter' }, ' hoặc nút ', { tag: 'em', text: '▶ Run' }, ' để chạy.'],
      ['Xem kết quả ở panel ', { tag: 'code', text: 'Output' }, ' bên phải.'],
      ['Mở tab ', { tag: 'em', text: 'Test Cases' }, ' để tạo bộ test và chấm tự động.'],
    ],
  },

  shortcutsPage: {
    title:    'Keyboard Shortcuts',
    subtitle: 'Nhấn ? bất kỳ lúc nào trong editor để xem nhanh danh sách này.',
    sections: [
      {
        title: '▶ Chạy code', color: 'text-indigo-400',
        items: [
          { keys: ['Ctrl', 'Enter'],      desc: 'Compile & Run — hoặc "Run All" nếu đang ở tab Test Cases' },
          { keys: ['Ctrl', 'Shift', 'F'], desc: 'Format (đẹp) toàn bộ code tự động' },
        ],
      },
      {
        title: '✏️ Soạn thảo', color: 'text-emerald-400',
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
        title: '🔍 Tìm kiếm', color: 'text-yellow-400',
        items: [
          { keys: ['Ctrl', 'F'],          desc: 'Mở thanh tìm kiếm trong code' },
          { keys: ['Ctrl', 'H'],          desc: 'Tìm và thay thế (Find & Replace)' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: 'Command Palette — tìm mọi lệnh Monaco' },
        ],
      },
      {
        title: '🖥️ Giao diện', color: 'text-violet-400',
        items: [
          { keys: ['?'],   desc: 'Mở / đóng modal phím tắt này' },
          { keys: ['Esc'], desc: 'Đóng modal / panel đang mở' },
        ],
      },
      {
        title: '📱 Mobile (chạm)', color: 'text-orange-400',
        items: [
          { keys: ['Long press (giữ)'],  desc: 'Chọn từ dưới ngón tay, kéo để mở rộng vùng chọn' },
          { keys: ['Nút Copy (toolbar)'], desc: 'Copy toàn bộ code, hoặc copy vùng đã chọn' },
        ],
      },
    ],
    tipLabel: 'Mẹo:',
    tip: 'Monaco Editor hỗ trợ hầu hết phím tắt của VS Code. Mở Command Palette (Ctrl+Shift+P) để tìm thêm lệnh.',
  },

  testCasesPage: {
    title:    'Test Cases',
    subtitle: 'Tạo bộ test, chấm Pass/Fail tự động, export/import.',
    s1: {
      title: '1. Chuyển sang chế độ Test Cases',
      paras: [
        'Ở góc trên trái header, click tab Test Cases (hoặc giữ Ctrl+Enter sẽ chạy tất cả test).',
        'Panel bên phải chuyển thành danh sách test cases với status badge.',
      ],
    },
    s2: {
      title: '2. Thêm test case',
      paras: ['Click nút Add trên thanh header của panel Test Cases.', 'Modal mở ra, điền:'],
      fields: [
        { name: 'Label',           desc: 'tên test (vd: "Test 1 - Small")' },
        { name: 'Input (stdin)',   desc: 'nội dung sẽ được pipe vào chương trình' },
        { name: 'Expected Output', desc: 'kết quả mong đợi để chấm Pass/Fail' },
      ],
      note: 'Nếu bỏ trống Expected Output, test case vẫn chạy được nhưng luôn hiển thị ✓ (không chấm).',
    },
    s3: {
      title: '3. Chạy test',
      actions: [
        { label: 'Run All', desc: 'Chạy toàn bộ test cases song song. Kết quả hiện ngay.' },
        { label: '▶',       desc: 'Icon ▶ nhỏ trong mỗi test card — chạy đúng test đó.' },
        { label: 'Reset',   desc: 'Xóa tất cả kết quả, đưa về trạng thái idle (hiện sau khi Run).' },
      ],
    },
    s4: {
      title: '4. Đọc kết quả',
      statuses: [
        { label: 'Pass',    color: 'text-green-400',  desc: 'Output khớp với Expected (bỏ qua trailing whitespace).' },
        { label: 'Fail',    color: 'text-red-400',    desc: 'Output khác Expected — click vào card để xem diff.' },
        { label: 'Error',   color: 'text-orange-400', desc: 'Compile error hoặc runtime error (exit code ≠ 0).' },
        { label: 'Timeout', color: 'text-yellow-400', desc: 'Chương trình chạy quá thời gian giới hạn.' },
      ],
    },
    s5: {
      title: '5. Duplicate test case',
      paras: [
        'Click icon Copy trong card để tạo bản sao ngay bên dưới.',
        'Hữu ích khi muốn tạo nhiều test tương tự (chỉ đổi input nhỏ).',
      ],
    },
    s6: {
      title: '6. Export / Import bộ test',
      export: { label: 'Export — tải xuống file testcases.json', desc: 'Format JSON sạch, không có ID, dễ chỉnh tay hoặc generate script.' },
      import: { label: 'Import — chọn file .json từ máy', desc: 'Tải bộ test vào, thay thế toàn bộ test hiện tại. ID được tạo mới.' },
      formatLabel: 'Format file JSON:',
    },
    proTip: 'Pro tip: Dùng script Python để generate bộ test lớn → export JSON → import vào editor. Mỗi test case là 1 object với 3 field: label, input, expectedOutput.',
  },

  tipsPage: {
    title:    'CP Tips & Templates',
    subtitle: 'Mẹo và template cho Competitive Programming.',
    s1: {
      title: '📚 Dùng Templates Panel',
      paras: [
        'Click icon Templates trên thanh pane bar của code editor.',
        'Panel trượt ra từ trái — tìm kiếm, chọn template và click Chèn vào Editor.',
        'Templates có sẵn:',
      ],
      insertLabel: 'Chèn vào Editor',
    },
    s2: {
      title: '⚡ Fast I/O — luôn thêm vào đầu main()',
      desc:  'Tắt sync giữa C stdio và C++ streams. Bắt buộc khi dùng cin/cout với input lớn — không ảnh hưởng đến tính đúng của kết quả.',
    },
    s3: {
      title: '🔧 Tricks hay dùng',
      tricks: [
        { title: 'Đọc input nhanh' },
        { title: "Output nhanh — '\\n' thay vì endl" },
        { title: 'Pair và tuple' },
        { title: 'Lambda comparator cho sort' },
        { title: 'GCD / LCM (C++17)' },
        { title: 'Bit tricks' },
      ],
    },
    s4: {
      title: '⏱️ Tối ưu khi bị TLE',
      tips: [
        'Bật -O2 optimize trong header (toggle ở header bar) — tăng tốc 2–5x.',
        'Dùng printf/scanf nếu vẫn chậm sau fast I/O.',
        "Tránh endl, dùng '\\n'.",
        'reserve() cho vector nếu biết trước kích thước.',
        'Dùng unordered_map thay map khi không cần thứ tự (O(1) vs O(log n)).',
        'Tăng timeout trong Settings nếu cần kiểm thử giải pháp chậm.',
      ],
    },
    s5: {
      title: '📊 Ước tính Complexity',
      rows: [
        { n: '10⁸ operations', time: '~1s',        note: 'Giới hạn thông thường của OJ' },
        { n: 'n ≤ 10⁶',        time: 'O(n log n)', note: 'Sort, BIT, Segment tree' },
        { n: 'n ≤ 10⁵',        time: 'O(n log²n)', note: 'Merge sort tree, offline' },
        { n: 'n ≤ 5000',       time: 'O(n²)',       note: 'DP 2D cơ bản' },
        { n: 'n ≤ 500',        time: 'O(n³)',       note: 'Floyd-Warshall, matrix chain' },
        { n: 'n ≤ 20',         time: 'O(2ⁿ)',       note: 'Bitmask DP' },
      ],
    },
    s6: {
      title: '🤖 IntelliSense cho hàm tự viết',
      paras: ['Editor tự động nhận diện các hàm bạn viết và cung cấp:'],
      features: [
        { label: 'Autocomplete',    desc: '— gõ tên hàm, dropdown gợi ý xuất hiện' },
        { label: 'Parameter hints', desc: '— gõ funcName(, tooltip hiện tên từng tham số' },
        { note: 'Ký tự hoạt động với mọi ngôn ngữ: C++, C, Python' },
      ],
    },
  },

  shortcutsModal: {
    title:  'Keyboard Shortcuts',
    footer: 'Nhấn ? hoặc Esc để đóng',
    sections: [
      {
        title: 'Chạy code',
        items: [
          { keys: ['Ctrl', 'Enter'],      desc: 'Compile & Run (hoặc Run All nếu đang ở tab Test Cases)' },
          { keys: ['Ctrl', 'Shift', 'F'], desc: 'Format code (đẹp code tự động)' },
        ],
      },
      {
        title: 'Editor',
        items: [
          { keys: ['Ctrl', 'Z'],          desc: 'Undo' },
          { keys: ['Ctrl', 'Y'],          desc: 'Redo' },
          { keys: ['Ctrl', 'D'],          desc: 'Duplicate dòng hiện tại' },
          { keys: ['Ctrl', '/'],          desc: 'Comment / Uncomment dòng' },
          { keys: ['Ctrl', 'F'],          desc: 'Tìm kiếm trong code' },
          { keys: ['Ctrl', 'H'],          desc: 'Tìm và thay thế' },
          { keys: ['Ctrl', 'G'],          desc: 'Nhảy đến dòng số...' },
          { keys: ['Alt', '↑/↓'],         desc: 'Di chuyển dòng lên/xuống' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: 'Xóa dòng hiện tại' },
          { keys: ['Tab'],                desc: 'Indent (trong Input: chèn 2 spaces)' },
          { keys: ['Shift', 'Tab'],       desc: 'Unindent' },
        ],
      },
      {
        title: 'Giao diện',
        items: [
          { keys: ['?'],                  desc: 'Mở / đóng modal phím tắt này' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: 'Command Palette Monaco (tìm mọi lệnh)' },
        ],
      },
      {
        title: 'Mobile (chạm)',
        items: [
          { keys: ['Long press'],  desc: 'Chọn từ, kéo để mở rộng vùng chọn' },
          { keys: ['Copy button'], desc: 'Copy toàn bộ code hoặc vùng đã chọn' },
        ],
      },
    ],
  },

  header: {
    openInput:       'Mở input.txt',
    download:        'Tải file',
    filenamePrompt:  'Tên file:',
    downloadSuccess: (name: string) => `Đã tải ${name}`,
  },

  settings: {
    showWarningsDesc: 'Hiển thị compiler warnings (màu vàng) trong tab Errors — tắt để chỉ thấy errors',
    runTimeoutDesc:   'Dừng chương trình nếu chạy quá thời gian',
    themes: [
      { value: 'vs-dark',  label: 'VS Dark',      desc: 'Mặc định — nền tối' },
      { value: 'vs',       label: 'VS Light',      desc: 'Nền sáng' },
      { value: 'hc-black', label: 'High Contrast', desc: 'Tương phản cao, dễ đọc' },
    ],
    title:              'Cài đặt Editor',
    savedAutomatically: 'Cài đặt tự động lưu',
    sections: {
      intellisense: 'IntelliSense',
      display:      'Hiển thị',
      typography:   'Chữ',
      theme:        'Giao diện',
      execution:    'Thực thi',
    },
    toggles: {
      suggestions:             { label: 'Bật gợi ý',                    desc: 'Bật/tắt toàn bộ autocomplete' },
      quickSuggestions:        { label: 'Gợi ý nhanh inline',           desc: 'Hiện gợi ý khi đang gõ (không cần trigger)' },
      parameterHints:          { label: 'Gợi ý tham số',                desc: "Hiện signature hàm khi gõ '('" },
      snippets:                { label: 'Snippet',                      desc: 'Bật template snippet (fori, bfs, dfs, dp...)' },
      minimap:                 { label: 'Minimap',                      desc: 'Hiện tổng quan code ở lề phải' },
      wordWrap:                { label: 'Xuống dòng tự động',           desc: 'Gấp dòng dài thay vì scroll ngang' },
      lineNumbers:             { label: 'Số dòng',                      desc: 'Hiện số dòng ở lề trái' },
      bracketPairColorization: { label: 'Tô màu ngoặc đôi',            desc: 'Tô màu các cặp ngoặc tương ứng' },
      renderWhitespace:        { label: 'Hiện khoảng trắng',            desc: 'Hiện chấm cho khoảng trắng trong vùng chọn' },
      showWarnings:            { label: 'Hiện cảnh báo',                desc: 'Hiện compiler warnings (màu vàng) trong tab Errors' },
      fontLigatures:           { label: 'Font Ligatures',               desc: 'Bật ligatures (→, ≥, !=, v.v. với JetBrains Mono)' },
      smoothCaret:             { label: 'Con trỏ mượt',                 desc: 'Thêm hiệu ứng chuyển động cho con trỏ' },
    },
    fontSize:   'Cỡ chữ',
    tabSize:    'Tab Size',
    runTimeout: 'Thời gian chạy tối đa',
  },

  output: {
    clearOutput: 'Xóa output',
    compiling:   'Đang compile và chạy...',
    runHint:     'Nhấn Run hoặc Ctrl+Enter để compile',
    timeout:     '⏱ Chương trình bị dừng do timeout.',
    noRuns:      'Chưa có lần chạy nào',
    copy:        'Sao chép',
    infoLabels:  { compile: 'Biên dịch', exitCode: 'Mã thoát', runtime: 'Thời gian', timeout: 'Timeout', warnings: 'Cảnh báo' },
    infoValues:  { failed: '❌ Thất bại', success: '✅ Thành công', na: 'N/A', yes: '⚠️ Có', no: 'Không', shown: 'hiện', hidden: 'ẩn', none: 'Không có' },
    historyStatus: { timeout: 'Timeout', error: 'Lỗi', ok: 'OK' },
  },

  testCasePanel: {
    resetResults: 'Reset tất cả kết quả về idle',
    addTestCase:  'Thêm test case',
    runAll:       'Chạy tất cả',
    editTestCase: 'Sửa test case',
    runThis:      'Chạy test này',
    duplicated:   (label: string) => `Đã duplicate "${label}"`,
    exportedN:    (n: number) => `Đã export ${n} test case${n !== 1 ? 's' : ''}!`,
    exportError:  'Không thể export test cases.',
    importedN:    (n: number) => `Đã import ${n} test case${n !== 1 ? 's' : ''}!`,
    importError:  'File không hợp lệ. Cần JSON: [{label, input, expectedOutput}]',
  },

  testCaseModal: {
    inputPlaceholder:  'Nhập input cho test case này...\n(sẽ được truyền vào cin / sys.stdin)',
    outputPlaceholder: 'Nhập output mong muốn...\n(dùng để so sánh Pass/Fail sau khi chạy)',
    emptyOutputNote:   'để trống = không chấm điểm',
  },

  codeEditor: {
    copySelection: 'Copy vùng đã chọn',
    copyAll:       'Copy toàn bộ code',
  },

  editorLayout: {
    compilingToast:   '⚙ Đang compile…',
    compileError:     '❌ Compile error!',
    timeoutWarning:   '⏱ Timeout!',
    cannotConnect:    'Không thể kết nối server.',
    batchCompiling:   '⚙ Đang compile…',
    batchRunning:     (n: number) => `▶ Chạy ${n} test cases…`,
    sharedBanner:     'Đang xem code được chia sẻ — thay đổi sẽ không được lưu.',
    editorSettings:   'Cài đặt editor',
    inputPlaceholder: 'Nhập stdin ở đây...\n(nội dung sẽ truyền vào cin)',
  },

  templatesPanel: {
    searchPlaceholder: 'Tìm template...',
    insertButton:      'Chèn vào Editor',
  },

  sharedPage: {
    decoding:    'Đang giải nén dữ liệu từ share link...',
    decodeError: 'Lỗi giải mã',
    goHome:      'Về trang chính',
  },



  ui: {
    run:       'Chạy',
    runAll:    'Chạy tất cả',
    singleRun: 'Chạy đơn',
    format:    'Format',
    copy:      'Copy',
    clear:     'Xóa',
    input:     'Input',
    optimize:  'Tối ưu',
    tabs: {
      output:  'Output',
      errors:  'Lỗi',
      info:    'Thông tin',
      history: 'Lịch sử',
      code:    'Code',
      input:   'Input',
      tests:   'Tests',
    },
    badges: {
      compileError:  'Lỗi biên dịch',
      warning:       'Cảnh báo',
      timeout:       'Timeout',
      runtimeStderr: 'Lỗi runtime',
    },
    nRecentRuns: (n: number) => `${n} lần chạy gần nhất (phiên này)`,
    close:             'Đóng',
    undo:              'Hoàn tác (Ctrl+Z)',
    redo:              'Làm lại (Ctrl+Y)',
    shareLink:         'Tạo share link (nén fflate)',
    exportTestCases:   'Xuất test cases (.json)',
    importTestCases:   'Nhập test cases (.json)',
    duplicateTestCase: 'Nhân đôi test case',
    templatesTitle:    'Templates CP (Ctrl+T)',
    shortcutsTitle:    'Phím tắt (?)',
    optimizeOn:        'Tối ưu (-O2) — nhấn để chuyển sang Fast',
    optimizeOff:       'Nhanh (-O0) — nhấn để chuyển sang Optimize',
    srcHints:  { cpp: 'Source C++', c: 'Source C', python: 'Source Python' },
    fileHints: { stdin: 'Đầu vào (stdin)', stdout: 'Đầu ra (stdout)' },
  },
};
