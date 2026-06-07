/**
 * lib/i18n.ts
 * Central translation file — ALL user-visible text lives here.
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  To add a new language — edit ONLY this file:               ║
 * ║  1. Add its code to SUPPORTED_LANGS (type auto-derives)     ║
 * ║  2. Add its display name to LANG_NAMES                      ║
 * ║  3. Write the translation object (TS enforces the shape)     ║
 * ║  4. Add it to the `translations` registry at the bottom     ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * To add new strings: add to the `Translations` interface + every
 * language object. TypeScript will flag any missing keys.
 */

// ① The single source of truth for supported languages.
//    Lang type is DERIVED automatically — never write it by hand.
export const SUPPORTED_LANGS = ['en', 'vi'] as const;
export type   Lang            = typeof SUPPORTED_LANGS[number]; // 'en' | 'vi' | ...
export const  DEFAULT_LANG: Lang = 'en';

// ② Native display names shown in the language selector UI.
//    One entry per language — lives here, not inside every translation object.
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Type helpers                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

interface ShortcutItem  { keys: string[]; desc: string }
interface ShortcutSection { title: string; color: string; items: ShortcutItem[] }
interface ModalSection    { title: string; items: ShortcutItem[] }
interface StatusRow       { label: string; color: string; desc: string }
interface TrickTitle      { title: string }
interface ComplexRow      { n: string; time: string; note: string }
interface TipsFeature     { label?: string; desc?: string; note?: string }
interface ThemeOpt        { value: 'vs-dark' | 'vs' | 'hc-black'; label: string; desc: string }
interface TCSection_Switch { title: string; paras: string[] }
interface TCSection_Add    { title: string; paras: string[]; fields: { name: string; desc: string }[]; note: string }
interface TCSection_Run    { title: string; actions: { label: string; desc: string }[] }
interface TCSection_Read   { title: string; statuses: StatusRow[] }
interface TCSection_Dup    { title: string; paras: string[] }
interface TCSection_Export { title: string; export: { label: string; desc: string }; import: { label: string; desc: string }; formatLabel: string }

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Translation shape                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface Translations {
  /* Guide sidebar/nav */
  guide: {
    navLabel:     string;
    backToEditor: string;
    overview:     string;
    shortcuts:    string;
    testCases:    string;
    cpTips:       string;
  };

  /* Guide overview page */
  overview: {
    title:         string;
    subtitle:      string;
    cards: { title: string; desc: string }[];
    featuresTitle: string;
    features: { title: string; desc: string }[];
    quickStartTitle: string;
    quickStartSteps: (string | { tag: 'link' | 'code' | 'kbd' | 'em'; text: string })[][];
  };

  /* Guide shortcuts page */
  shortcutsPage: {
    title:    string;
    subtitle: string;
    sections: ShortcutSection[];
    tipLabel: string;
    tip:      string;
  };

  /* Guide test cases page */
  testCasesPage: {
    title:    string;
    subtitle: string;
    s1: TCSection_Switch;
    s2: TCSection_Add;
    s3: TCSection_Run;
    s4: TCSection_Read;
    s5: TCSection_Dup;
    s6: TCSection_Export;
    proTip: string;
  };

  /* Guide tips page */
  tipsPage: {
    title:    string;
    subtitle: string;
    s1: { title: string; paras: string[]; insertLabel: string };
    s2: { title: string; desc: string };
    s3: { title: string; tricks: TrickTitle[] };
    s4: { title: string; tips: string[] };
    s5: { title: string; rows: ComplexRow[] };
    s6: { title: string; paras: string[]; features: TipsFeature[] };
  };

  /* ShortcutsModal (in-editor popup) */
  shortcutsModal: {
    title:    string;
    footer:   string;
    sections: ModalSection[];
  };

  /* Header component */
  header: {
    openInput:       string;
    download:        string;
    filenamePrompt:  string;
    downloadSuccess: (name: string) => string;
  };

  /* Settings panel */
  settings: {
    showWarningsDesc: string;
    runTimeoutDesc:   string;
    themes:           ThemeOpt[];
  };

  /* Output panel */
  output: {
    clearOutput: string;
    compiling:   string;
    runHint:     string;
    timeout:     string;
    noRuns:      string;
  };

  /* Test case panel */
  testCasePanel: {
    resetResults:  string;
    addTestCase:   string;
    runAll:        string;
    editTestCase:  string;
    runThis:       string;
    duplicated:    (label: string) => string;
    exportedN:     (n: number) => string;
    exportError:   string;
    importedN:     (n: number) => string;
    importError:   string;
  };

  /* Test case modal */
  testCaseModal: {
    inputPlaceholder:  string;
    outputPlaceholder: string;
    emptyOutputNote:   string;
  };

  /* Code editor */
  codeEditor: {
    copySelection: string;
    copyAll:       string;
  };

  /* EditorLayout */
  editorLayout: {
    compilingToast:   string;
    compileError:     string;
    timeoutWarning:   string;
    cannotConnect:    string;
    batchCompiling:   string;
    batchRunning:     (n: number) => string;
    sharedBanner:     string;
    editorSettings:   string;
    inputPlaceholder: string;
  };

  /* Templates panel */
  templatesPanel: {
    searchPlaceholder: string;
    insertButton:      string;
  };

  /* Shared view page (/s/[data]) */
  sharedPage: {
    decoding:    string;
    decodeError: string;
    goHome:      string;
  };

}  // Translations

/* ─────────────────────────────────────────────────────────────────────────── */
/*  English (en)                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

const en: Translations = {
  guide: {
    navLabel:     'Guide',
    backToEditor: '← Back to Editor',
    overview:     'Overview',
    shortcuts:    'Shortcuts',
    testCases:    'Test Cases',
    cpTips:       'CP Tips',
  },

  overview: {
    title:    'CppEditor Guide',
    subtitle: 'Online compiler supporting C++20, C++17, C11 and Python 3 — optimized for Competitive Programming. Choose a topic below to get started.',
    cards: [
      { title: 'Keyboard Shortcuts', desc: 'Ctrl+Enter, Ctrl+Shift+F, ? and all shortcuts to code faster.' },
      { title: 'Test Cases',         desc: 'Create, run, export/import test sets — test workflow like a pro.' },
      { title: 'CP Tips & Templates', desc: 'DSU, Segment tree, Dijkstra templates — insert with 1 click.' },
    ],
    featuresTitle: 'Feature Highlights',
    features: [
      { title: 'Compile & Run Fast',   desc: 'WebSocket streaming — output appears line by line, no waiting.' },
      { title: 'Test Case Engine',     desc: 'Auto Pass/Fail grading, expected output comparison, parallel runs.' },
      { title: 'Share Link',           desc: 'Share code + input via short URL — anyone who opens it sees exactly what you do.' },
      { title: 'Full IntelliSense',    desc: 'Self-defined function suggestions, parameter hints, STL completions.' },
      { title: 'Deep Customization',   desc: 'Font, theme, timeout, warnings, IntelliSense — all in Settings.' },
    ],
    quickStartTitle: '⚡ Quick Start',
    quickStartSteps: [
      ['Open the ', { tag: 'link', text: 'main page' }, ', select language in the top right.'],
      ['Type code into the ', { tag: 'code', text: 'main.cpp' }, ' panel on the left.'],
      ['Press ', { tag: 'kbd',  text: 'Ctrl+Enter' }, ' or the ', { tag: 'em', text: '▶ Run' }, ' button to execute.'],
      ['View results in the ', { tag: 'code', text: 'Output' }, ' panel on the right.'],
      ['Open the ', { tag: 'em', text: 'Test Cases' }, ' tab to create test sets and auto-grade.'],
    ],
  },

  shortcutsPage: {
    title:    'Keyboard Shortcuts',
    subtitle: 'Press ? anytime in the editor to quickly view this list.',
    sections: [
      {
        title: '▶ Run Code', color: 'text-indigo-400',
        items: [
          { keys: ['Ctrl', 'Enter'],      desc: 'Compile & Run — or "Run All" if on Test Cases tab' },
          { keys: ['Ctrl', 'Shift', 'F'], desc: 'Auto-format all code' },
        ],
      },
      {
        title: '✏️ Editing', color: 'text-emerald-400',
        items: [
          { keys: ['Ctrl', 'Z'],          desc: 'Undo' },
          { keys: ['Ctrl', 'Y'],          desc: 'Redo (or Ctrl+Shift+Z)' },
          { keys: ['Ctrl', 'D'],          desc: 'Duplicate current line downward' },
          { keys: ['Ctrl', '/'],          desc: 'Comment / Uncomment line (//...)' },
          { keys: ['Alt', '↑ / ↓'],       desc: 'Move entire line up / down' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: 'Delete current line' },
          { keys: ['Ctrl', 'G'],          desc: 'Go to line number...' },
          { keys: ['Tab'],                desc: 'Indent — in Input area: insert 2 spaces' },
          { keys: ['Shift', 'Tab'],       desc: 'Unindent' },
        ],
      },
      {
        title: '🔍 Search', color: 'text-yellow-400',
        items: [
          { keys: ['Ctrl', 'F'],          desc: 'Open search bar in code' },
          { keys: ['Ctrl', 'H'],          desc: 'Find and Replace' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: 'Command Palette — find any Monaco command' },
        ],
      },
      {
        title: '🖥️ UI', color: 'text-violet-400',
        items: [
          { keys: ['?'],   desc: 'Open / close this shortcut modal' },
          { keys: ['Esc'], desc: 'Close modal / open panel' },
        ],
      },
      {
        title: '📱 Mobile (touch)', color: 'text-orange-400',
        items: [
          { keys: ['Long press (hold)'],   desc: 'Select word under finger, drag to expand selection' },
          { keys: ['Copy (toolbar)'],      desc: 'Copy all code, or copy selected region' },
        ],
      },
    ],
    tipLabel: 'Tip:',
    tip: 'Monaco Editor supports most VS Code shortcuts. Open Command Palette (Ctrl+Shift+P) to find more commands.',
  },

  testCasesPage: {
    title:    'Test Cases',
    subtitle: 'Create test sets, auto Pass/Fail grading, export/import.',
    s1: {
      title: '1. Switch to Test Cases Mode',
      paras: [
        'In the top-left header, click the Test Cases tab (or press Ctrl+Enter to run all tests).',
        'The right panel switches to a list of test cases with status badges.',
      ],
    },
    s2: {
      title: '2. Add a Test Case',
      paras: ['Click the Add button on the Test Cases panel header.', 'A modal opens, fill in:'],
      fields: [
        { name: 'Label',           desc: 'test name (e.g. "Test 1 - Small")' },
        { name: 'Input (stdin)',   desc: 'content to be piped into the program' },
        { name: 'Expected Output', desc: 'expected result for Pass/Fail grading' },
      ],
      note: 'If Expected Output is left empty, the test case still runs but always shows ✓ (no grading).',
    },
    s3: {
      title: '3. Run Tests',
      actions: [
        { label: 'Run All', desc: 'Run all test cases in parallel. Results appear immediately.' },
        { label: '▶',       desc: 'Small ▶ icon in each test card — runs just that test.' },
        { label: 'Reset',   desc: 'Clear all results, reset to idle state (shown after running).' },
      ],
    },
    s4: {
      title: '4. Read Results',
      statuses: [
        { label: 'Pass',    color: 'text-green-400',  desc: 'Output matches Expected (ignores trailing whitespace).' },
        { label: 'Fail',    color: 'text-red-400',    desc: 'Output differs from Expected — click card to see diff.' },
        { label: 'Error',   color: 'text-orange-400', desc: 'Compile error or runtime error (exit code ≠ 0).' },
        { label: 'Timeout', color: 'text-yellow-400', desc: 'Program ran past the time limit.' },
      ],
    },
    s5: {
      title: '5. Duplicate a Test Case',
      paras: [
        'Click the Copy icon in a card to create a copy directly below.',
        'Useful when creating many similar tests (just change small parts of the input).',
      ],
    },
    s6: {
      title: '6. Export / Import Test Sets',
      export: { label: 'Export — download testcases.json', desc: 'Clean JSON format, no IDs, easy to edit by hand or generate with a script.' },
      import: { label: 'Import — select a .json file from disk', desc: 'Load the test set, replacing all current tests. IDs are generated fresh.' },
      formatLabel: 'JSON file format:',
    },
    proTip: 'Pro tip: Use a Python script to generate large test sets → export JSON → import into the editor. Each test case is 1 object with 3 fields: label, input, expectedOutput.',
  },

  tipsPage: {
    title:    'CP Tips & Templates',
    subtitle: 'Tips and templates for Competitive Programming.',
    s1: {
      title: '📚 Using the Templates Panel',
      paras: [
        'Click the Templates icon on the code editor pane bar.',
        'The panel slides out from the left — search, choose a template and click Insert into Editor.',
        'Available templates:',
      ],
      insertLabel: 'Insert into Editor',
    },
    s2: {
      title: '⚡ Fast I/O — always add at the top of main()',
      desc:  'Disable sync between C stdio and C++ streams. Required when using cin/cout with large input — does not affect correctness.',
    },
    s3: {
      title: '🔧 Common Tricks',
      tricks: [
        { title: 'Read input fast' },
        { title: "Fast output — '\\n' instead of endl" },
        { title: 'Pair and tuple' },
        { title: 'Lambda comparator for sort' },
        { title: 'GCD / LCM (C++17)' },
        { title: 'Bit tricks' },
      ],
    },
    s4: {
      title: '⏱️ Optimization for TLE',
      tips: [
        'Enable -O2 optimize in the header (toggle in header bar) — speeds up 2–5x.',
        'Use printf/scanf if still slow after fast I/O.',
        "Avoid endl, use '\\n' instead.",
        'reserve() for vector if size is known in advance.',
        'Use unordered_map instead of map when order is not needed (O(1) vs O(log n)).',
        'Increase timeout in Settings if you need to test a slow solution.',
      ],
    },
    s5: {
      title: '📊 Complexity Estimation',
      rows: [
        { n: '10⁸ operations', time: '~1s',          note: 'Typical OJ time limit' },
        { n: 'n ≤ 10⁶',        time: 'O(n log n)',   note: 'Sort, BIT, Segment tree' },
        { n: 'n ≤ 10⁵',        time: 'O(n log²n)',   note: 'Merge sort tree, offline' },
        { n: 'n ≤ 5000',       time: 'O(n²)',         note: 'Basic 2D DP' },
        { n: 'n ≤ 500',        time: 'O(n³)',         note: 'Floyd-Warshall, matrix chain' },
        { n: 'n ≤ 20',         time: 'O(2ⁿ)',         note: 'Bitmask DP' },
      ],
    },
    s6: {
      title: '🤖 IntelliSense for User-Defined Functions',
      paras: ['The editor automatically detects functions you write and provides:'],
      features: [
        { label: 'Autocomplete',     desc: '— type a function name, dropdown suggestion appears' },
        { label: 'Parameter hints',  desc: '— type funcName(, tooltip shows each parameter name' },
        { note: 'Works with all languages: C++, C, Python' },
      ],
    },
  },

  shortcutsModal: {
    title:  'Keyboard Shortcuts',
    footer: 'Press ? or Esc to close',
    sections: [
      {
        title: 'Run Code',
        items: [
          { keys: ['Ctrl', 'Enter'],      desc: 'Compile & Run (or Run All if on Test Cases tab)' },
          { keys: ['Ctrl', 'Shift', 'F'], desc: 'Format code (auto-beautify)' },
        ],
      },
      {
        title: 'Editor',
        items: [
          { keys: ['Ctrl', 'Z'],          desc: 'Undo' },
          { keys: ['Ctrl', 'Y'],          desc: 'Redo' },
          { keys: ['Ctrl', 'D'],          desc: 'Duplicate current line' },
          { keys: ['Ctrl', '/'],          desc: 'Comment / Uncomment line' },
          { keys: ['Ctrl', 'F'],          desc: 'Search in code' },
          { keys: ['Ctrl', 'H'],          desc: 'Find and Replace' },
          { keys: ['Ctrl', 'G'],          desc: 'Go to line number...' },
          { keys: ['Alt', '↑/↓'],         desc: 'Move line up/down' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: 'Delete current line' },
          { keys: ['Tab'],                desc: 'Indent (in Input: insert 2 spaces)' },
          { keys: ['Shift', 'Tab'],       desc: 'Unindent' },
        ],
      },
      {
        title: 'UI',
        items: [
          { keys: ['?'],                  desc: 'Open / close this shortcut modal' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: 'Command Palette (find any Monaco command)' },
        ],
      },
      {
        title: 'Mobile (touch)',
        items: [
          { keys: ['Long press'],  desc: 'Select word, drag to expand selection' },
          { keys: ['Copy button'], desc: 'Copy all code or selected region' },
        ],
      },
    ],
  },

  header: {
    openInput:       'Open input.txt',
    download:        'Download file',
    filenamePrompt:  'File name:',
    downloadSuccess: (name: string) => `Downloaded ${name}`,
  },

  settings: {
    showWarningsDesc: 'Show compiler warnings (yellow) in Errors tab — disable to only see errors',
    runTimeoutDesc:   'Stop program if it runs past the time limit',
    themes: [
      { value: 'vs-dark',  label: 'VS Dark',       desc: 'Default — dark background' },
      { value: 'vs',       label: 'VS Light',       desc: 'Light background' },
      { value: 'hc-black', label: 'High Contrast',  desc: 'High contrast, easier to read' },
    ],
  },

  output: {
    clearOutput: 'Clear output',
    compiling:   'Compiling and running...',
    runHint:     'Press Run or Ctrl+Enter to compile',
    timeout:     '⏱ Program stopped due to timeout.',
    noRuns:      'No runs yet',
  },

  testCasePanel: {
    resetResults: 'Reset all results to idle',
    addTestCase:  'Add test case',
    runAll:       'Run all',
    editTestCase: 'Edit test case',
    runThis:      'Run this test',
    duplicated:   (label: string) => `Duplicated "${label}"`,
    exportedN:    (n: number) => `Exported ${n} test case${n !== 1 ? 's' : ''}!`,
    exportError:  'Cannot export test cases.',
    importedN:    (n: number) => `Imported ${n} test case${n !== 1 ? 's' : ''}!`,
    importError:  'Invalid file. Needs JSON: [{label, input, expectedOutput}]',
  },

  testCaseModal: {
    inputPlaceholder:  'Enter input for this test case...\n(will be passed to cin / sys.stdin)',
    outputPlaceholder: 'Enter expected output...\n(used to compare Pass/Fail after running)',
    emptyOutputNote:   'empty = no grading',
  },

  codeEditor: {
    copySelection: 'Copy selected region',
    copyAll:       'Copy all code',
  },

  editorLayout: {
    compilingToast:   '⚙ Compiling…',
    compileError:     '❌ Compile error!',
    timeoutWarning:   '⏱ Timeout!',
    cannotConnect:    'Cannot connect to server.',
    batchCompiling:   '⚙ Compiling…',
    batchRunning:     (n: number) => `▶ Running ${n} test cases…`,
    sharedBanner:     'Viewing shared code — changes will not be saved.',
    editorSettings:   'Editor settings',
    inputPlaceholder: 'Enter stdin here...\n(content will be passed to cin)',
  },

  templatesPanel: {
    searchPlaceholder: 'Search templates...',
    insertButton:      'Insert into Editor',
  },

  sharedPage: {
    decoding:    'Decoding share link data...',
    decodeError: 'Decode Error',
    goHome:      'Go to main page',
  },


};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Vietnamese (vi)                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

const vi: Translations = {
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
  },

  output: {
    clearOutput: 'Xóa output',
    compiling:   'Đang compile và chạy...',
    runHint:     'Nhấn Run hoặc Ctrl+Enter để compile',
    timeout:     '⏱ Chương trình bị dừng do timeout.',
    noRuns:      'Chưa có lần chạy nào',
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


};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Export                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

export const translations: Record<Lang, Translations> = { en, vi };
