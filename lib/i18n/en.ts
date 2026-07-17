/**
 * lib/i18n/en.ts — English
 */
import type { Translations } from './types';

export const en: Translations = {

  guide: {
    navLabel: 'Guide',
    backToEditor: '← Back to Editor',
    overview: 'Overview',
    shortcuts: 'Shortcuts',
    testCases: 'Test Cases',
    cpTips: 'CP Tips',
  },

  overview: {
    title: 'CppEditor Guide',
    subtitle: 'Online compiler supporting C++20, C++17, C11 and Python 3 — optimized for Competitive Programming. Choose a topic below to get started.',
    cards: [
      { title: 'Keyboard Shortcuts', desc: 'Ctrl+Enter, Alt+Shift+F, ? and all shortcuts to code faster.' },
      { title: 'Test Cases', desc: 'Create, run, export/import test sets — test workflow like a pro.' },
      { title: 'CP Tips & Templates', desc: 'DSU, Segment tree, Dijkstra templates — insert with 1 click.' },
    ],
    featuresTitle: 'Feature Highlights',
    features: [
      { title: 'Compile & Run Fast', desc: 'WebSocket streaming — output appears line by line, no waiting.' },
      { title: 'Test Case Engine', desc: 'Auto Pass/Fail grading, expected output comparison, parallel runs.' },
      { title: 'Share Link', desc: 'Share code + input via short URL — anyone who opens it sees exactly what you do.' },
      { title: 'Full IntelliSense', desc: 'Self-defined function suggestions, parameter hints, STL completions.' },
      { title: 'Deep Customization', desc: 'Font, theme, timeout, warnings, IntelliSense — all in Settings.' },
    ],
    quickStartTitle: '⚡ Quick Start',
    quickStartSteps: [
      ['Open the ', { tag: 'link', text: 'main page' }, ', select language in the top right.'],
      ['Type code into the ', { tag: 'code', text: 'main.cpp' }, ' panel on the left.'],
      ['Press ', { tag: 'kbd', text: 'Ctrl+Enter' }, ' or the ', { tag: 'em', text: '▶ Run' }, ' button to execute.'],
      ['View results in the ', { tag: 'code', text: 'Output' }, ' panel on the right.'],
      ['Open the ', { tag: 'em', text: 'Test Cases' }, ' tab to create test sets and auto-grade.'],
    ],
  },

  shortcutsPage: {
    title: 'Keyboard Shortcuts',
    subtitle: 'Press ? anytime in the editor to quickly view this list.',
    sections: [
      {
        title: '▶ Run Code', color: 'text-indigo-400',
        items: [
          { keys: ['Ctrl', 'Enter'], desc: 'Compile & Run — or "Run All" if on Test Cases tab' },
          { keys: ['Alt', 'Shift', 'F'], desc: 'Auto-format all code' },
        ],
      },
      {
        title: '✏️ Editing', color: 'text-emerald-400',
        items: [
          { keys: ['Ctrl', 'Z'], desc: 'Undo' },
          { keys: ['Ctrl', 'Y'], desc: 'Redo (or Ctrl+Shift+Z)' },
          { keys: ['Ctrl', 'D'], desc: 'Duplicate current line downward' },
          { keys: ['Ctrl', '/'], desc: 'Comment / Uncomment line (//...)' },
          { keys: ['Alt', '↑ / ↓'], desc: 'Move entire line up / down' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: 'Delete current line' },
          { keys: ['Ctrl', 'G'], desc: 'Go to line number...' },
          { keys: ['Tab'], desc: 'Indent — in Input area: insert 2 spaces' },
          { keys: ['Shift', 'Tab'], desc: 'Unindent' },
        ],
      },
      {
        title: '🔍 Search', color: 'text-yellow-400',
        items: [
          { keys: ['Ctrl', 'F'], desc: 'Open search bar in code' },
          { keys: ['Ctrl', 'H'], desc: 'Find and Replace' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: 'Command Palette — find any Monaco command' },
        ],
      },
      {
        title: '🖥️ UI', color: 'text-violet-400',
        items: [
          { keys: ['?'], desc: 'Open / close this shortcut modal' },
          { keys: ['Esc'], desc: 'Close modal / open panel' },
        ],
      },
      {
        title: '📱 Mobile (touch)', color: 'text-orange-400',
        items: [
          { keys: ['Long press (hold)'], desc: 'Select word under finger, drag to expand selection' },
          { keys: ['Copy (toolbar)'], desc: 'Copy all code, or copy selected region' },
        ],
      },
    ],
    tipLabel: 'Tip:',
    tip: 'Monaco Editor supports most VS Code shortcuts. Open Command Palette (Ctrl+Shift+P) to find more commands.',
  },

  testCasesPage: {
    title: 'Test Cases',
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
        { name: 'Label', desc: 'test name (e.g. "Test 1 - Small")' },
        { name: 'Input (stdin)', desc: 'content to be piped into the program' },
        { name: 'Expected Output', desc: 'expected result for Pass/Fail grading' },
      ],
      note: 'If Expected Output is left empty, the test case still runs but always shows ✓ (no grading).',
    },
    s3: {
      title: '3. Run Tests',
      actions: [
        { label: 'Run All', desc: 'Run all test cases in parallel. Results appear immediately.' },
        { label: '▶', desc: 'Small ▶ icon in each test card — runs just that test.' },
        { label: 'Reset', desc: 'Clear all results, reset to idle state (shown after running).' },
      ],
    },
    s4: {
      title: '4. Read Results',
      statuses: [
        { label: 'Pass', color: 'text-green-400', desc: 'Output matches Expected (ignores trailing whitespace).' },
        { label: 'Fail', color: 'text-red-400', desc: 'Output differs from Expected — click card to see diff.' },
        { label: 'Error', color: 'text-orange-400', desc: 'Compile error or runtime error (exit code ≠ 0).' },
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
    title: 'CP Tips & Templates',
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
      desc: 'Disable sync between C stdio and C++ streams. Required when using cin/cout with large input — does not affect correctness.',
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
        { n: '10⁸ operations', time: '~1s', note: 'Typical OJ time limit' },
        { n: 'n ≤ 10⁶', time: 'O(n log n)', note: 'Sort, BIT, Segment tree' },
        { n: 'n ≤ 10⁵', time: 'O(n log²n)', note: 'Merge sort tree, offline' },
        { n: 'n ≤ 5000', time: 'O(n²)', note: 'Basic 2D DP' },
        { n: 'n ≤ 500', time: 'O(n³)', note: 'Floyd-Warshall, matrix chain' },
        { n: 'n ≤ 20', time: 'O(2ⁿ)', note: 'Bitmask DP' },
      ],
    },
    s6: {
      title: '🤖 IntelliSense for User-Defined Functions',
      paras: ['The editor automatically detects functions you write and provides:'],
      features: [
        { label: 'Autocomplete', desc: '— type a function name, dropdown suggestion appears' },
        { label: 'Parameter hints', desc: '— type funcName(, tooltip shows each parameter name' },
        { note: 'Works with all languages: C++, C, Python' },
      ],
    },
  },

  shortcutsModal: {
    title: 'Keyboard Shortcuts',
    footer: 'Press ? or Esc to close',
    sections: [
      {
        title: 'Run Code',
        items: [
          { keys: ['Ctrl', 'Enter'], desc: 'Compile & Run (or Run All if on Test Cases tab)', id: 'run' },
          { keys: ['Alt', 'Shift', 'F'], desc: 'Format code (auto-beautify)', id: 'format' },
        ],
      },
      {
        title: 'Editor',
        items: [
          { keys: ['Ctrl', 'Z'], desc: 'Undo' },
          { keys: ['Ctrl', 'Y'], desc: 'Redo' },
          { keys: ['Ctrl', 'D'], desc: 'Duplicate current line' },
          { keys: ['Ctrl', '/'], desc: 'Comment / Uncomment line' },
          { keys: ['Ctrl', 'F'], desc: 'Search in code' },
          { keys: ['Ctrl', 'H'], desc: 'Find and Replace' },
          { keys: ['Ctrl', 'G'], desc: 'Go to line number...' },
          { keys: ['Alt', '↑/↓'], desc: 'Move line up/down' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: 'Delete current line' },
          { keys: ['Tab'], desc: 'Indent (in Input: insert 2 spaces)' },
          { keys: ['Shift', 'Tab'], desc: 'Unindent' },
        ],
      },
      {
        title: 'UI',
        items: [
          { keys: ['?'], desc: 'Open / close this shortcut modal' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: 'Command Palette (find any Monaco command)' },
        ],
      },
      {
        title: 'Mobile (touch)',
        items: [
          { keys: ['Long press'], desc: 'Select word, drag to expand selection' },
          { keys: ['Copy button'], desc: 'Copy all code or selected region' },
        ],
      },
    ],
  },

  header: {
    openInput: 'Open input.txt',
    download: 'Download file',
    filenamePrompt: 'File name:',
    downloadSuccess: (name: string) => `Downloaded ${name}`,
  },

  settings: {
    showWarningsDesc: 'Show compiler warnings (yellow) in Errors tab — disable to only see errors',
    runTimeoutDesc: 'Stop program if it runs past the time limit',
    themes: [
      { value: 'vs-dark', label: 'VS Dark', desc: 'Default — dark background' },
      { value: 'vs', label: 'VS Light', desc: 'Light background' },
      { value: 'hc-black', label: 'High Contrast', desc: 'High contrast, easier to read' },
    ],
    title: 'Editor Settings',
    savedAutomatically: 'Settings saved automatically',
    sections: {
      intellisense: 'IntelliSense',
      display: 'Display',
      typography: 'Typography',
      theme: 'Theme',
      execution: 'Execution',
    },
    toggles: {
      suggestions: { label: 'Enable Suggestions', desc: 'Master toggle — turns autocomplete on or off' },
      quickSuggestions: { label: 'Inline Quick Suggestions', desc: 'Show suggestions while typing (not just on trigger)' },
      parameterHints: { label: 'Parameter Hints', desc: "Show function signatures with parameter info when typing '('" },
      snippets: { label: 'Code Snippets', desc: 'Enable snippet templates (fori, bfs, dfs, dp...)' },
      minimap: { label: 'Minimap', desc: 'Show code overview in the right margin' },
      wordWrap: { label: 'Word Wrap', desc: 'Wrap long lines instead of horizontal scroll' },
      lineNumbers: { label: 'Line Numbers', desc: 'Show line numbers in the gutter' },
      bracketPairColorization: { label: 'Bracket Pair Colorization', desc: 'Color matching brackets/parentheses' },
      renderWhitespace: { label: 'Render Whitespace', desc: 'Show dots for spaces in selected text' },
      showWarnings: { label: 'Show Warnings', desc: 'Show compiler warnings (yellow) in Errors tab' },
      fontLigatures: { label: 'Font Ligatures', desc: 'Enable ligatures (→, ≥, !=, etc. with JetBrains Mono)' },
      smoothCaret: { label: 'Smooth Caret Animation', desc: 'Animate cursor movement' },
      useWasm: { label: 'Run in Browser (WASM)', desc: 'Execute code locally in your browser (zero server cost, offline support)' },
    },
    fontSize: 'Font Size',
    tabSize: 'Tab Size',
    runTimeout: 'Run Timeout',
  },

  output: {
    clearOutput: 'Clear output',
    compiling: 'Compiling and running...',
    runHint: 'Press Run or Ctrl+Enter to compile',
    timeout: '⏱ Program stopped due to timeout.',
    noRuns: 'No runs yet',
    copy: 'Copy',
    infoLabels: { compile: 'Compile', exitCode: 'Exit code', runtime: 'Runtime', timeout: 'Timeout', warnings: 'Warnings' },
    infoValues: { failed: '❌ Failed', success: '✅ Success', na: 'N/A', yes: '⚠️ Yes', no: 'No', shown: 'shown', hidden: 'hidden', none: 'None' },
    historyStatus: { timeout: 'Timeout', error: 'Error', ok: 'OK' },
  },

  testCasePanel: {
    resetResults: 'Reset all results to idle',
    addTestCase: 'Add test case',
    runAll: 'Run all',
    editTestCase: 'Edit test case',
    runThis: 'Run this test',
    duplicated: (label: string) => `Duplicated "${label}"`,
    exportedN: (n: number) => `Exported ${n} test case${n !== 1 ? 's' : ''}!`,
    exportError: 'Cannot export test cases.',
    importedN: (n: number) => `Imported ${n} test case${n !== 1 ? 's' : ''}!`,
    importError: 'Invalid file. Needs JSON: [{label, input, expectedOutput}]',
  },

  testCaseModal: {
    inputPlaceholder: 'Enter input for this test case...\n(will be passed to cin / sys.stdin)',
    outputPlaceholder: 'Enter expected output...\n(used to compare Pass/Fail after running)',
    emptyOutputNote: 'empty = no grading',
  },

  codeEditor: {
    copySelection: 'Copy selected region',
    copyAll: 'Copy all code',
  },

  editorLayout: {
    compilingToast: '⚙ Compiling…',
    compileError: '❌ Compile error!',
    timeoutWarning: '⏱ Timeout!',
    cannotConnect: 'Cannot connect to server.',
    batchCompiling: '⚙ Compiling…',
    batchRunning: (n: number) => `▶ Running ${n} test cases…`,
    sharedBanner: 'Viewing shared code — changes will not be saved.',
    editorSettings: 'Editor settings',
    inputPlaceholder: 'Enter stdin here...\n(content will be passed to cin)',
  },

  templatesPanel: {
    searchPlaceholder: 'Search templates...',
    insertButton: 'Insert into Editor',
  },

  sharedPage: {
    decoding: 'Decoding share link data...',
    decodeError: 'Decode Error',
    goHome: 'Go to main page',
  },



  ui: {
    run: 'Run',
    runAll: 'Run All',
    singleRun: 'Single Run',
    format: 'Format',
    copy: 'Copy',
    clear: 'Clear',
    input: 'Input',
    optimize: 'Optimize',
    tabs: {
      output: 'Output',
      errors: 'Errors',
      info: 'Info',
      history: 'History',
      code: 'Code',
      input: 'Input',
      tests: 'Tests',
    },
    badges: {
      compileError: 'Compile Error',
      warning: 'Warning',
      timeout: 'Timeout',
      runtimeStderr: 'Runtime Stderr',
    },
    nRecentRuns: (n: number) => `${n} recent run${n !== 1 ? 's' : ''} (this session)`,
    close: 'Close',
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Y)',
    shareLink: 'Create share link (fflate compressed)',
    exportTestCases: 'Export test cases (.json)',
    importTestCases: 'Import test cases (.json)',
    duplicateTestCase: 'Duplicate test case',
    templatesTitle: 'Templates CP (Ctrl+T)',
    shortcutsTitle: 'Keyboard shortcuts (?)',
    optimizeOn: 'Optimize (-O2) — click to switch to Fast',
    optimizeOff: 'Fast (-O0) — click to switch to Optimize',
    srcHints: { cpp: 'C++ source', c: 'C source', python: 'Python source' },
    fileHints: { stdin: 'Stdin input', stdout: 'Stdout output' },
  },
};
