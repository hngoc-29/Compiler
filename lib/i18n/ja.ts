/**
 * lib/i18n/ja.ts — 日本語 (stub)
 * Copy từ en.ts, thay thế từng chuỗi bằng tiếng Nhật.
 * TypeScript sẽ báo lỗi compile nếu thiếu key nào.
 */
import type { Translations } from './types';

export const ja: Translations = {
  guide: {
    navLabel: 'ガイド',
    backToEditor: '← エディタへ',
    overview: '概要',
    shortcuts: 'ショートカット',
    testCases: 'テストケース',
    cpTips: 'CPのヒント',
  },

  overview: {
    title: 'CppEditor ガイド',
    subtitle: 'C++20, C++17, C11, Python 3 対応のオンラインコンパイラ — 競技プログラミング向け。',
    cards: [
      { title: 'キーボードショートカット', desc: 'Ctrl+Enter, Alt+Shift+F など、コーディングを速くするショートカット。' },
      { title: 'テストケース', desc: 'テストセットの作成・実行・エクスポート/インポート。' },
      { title: 'CPのヒントとテンプレート', desc: 'DSU, セグメントツリー, Dijkstra テンプレートをワンクリックで挿入。' },
    ],
    featuresTitle: '主な機能',
    features: [
      { title: '高速コンパイル&実行', desc: 'WebSocketストリーミング — 出力が行ごとにリアルタイム表示。' },
      { title: 'テストケースエンジン', desc: 'Pass/Fail自動採点、期待出力との比較、並列実行。' },
      { title: '共有リンク', desc: 'コード+入力を短いURLで共有 — 誰でも同じ状態を確認できます。' },
      { title: '完全なIntelliSense', desc: '自定義関数の補完、パラメータヒント、STL補完。' },
      { title: '豊富なカスタマイズ', desc: 'フォント、テーマ、タイムアウト、警告、IntelliSense — すべて設定可能。' },
    ],
    quickStartTitle: '⚡ クイックスタート',
    quickStartSteps: [
      ['', { tag: 'link' as const, text: 'メインページ' }, 'を開き、右上で言語を選択。'],
      ['', { tag: 'code' as const, text: 'main.cpp' }, 'パネルにコードを入力。'],
      ['', { tag: 'kbd' as const, text: 'Ctrl+Enter' }, 'または', { tag: 'em' as const, text: '▶ Run' }, 'ボタンで実行。'],
      ['', { tag: 'code' as const, text: 'Output' }, 'パネルで結果を確認。'],
      ['', { tag: 'em' as const, text: 'Test Cases' }, 'タブでテストセットを作成し自動採点。'],
    ],
  },

  shortcutsPage: {
    title: 'キーボードショートカット',
    subtitle: 'エディタ内でいつでも ? を押して確認できます。',
    sections: [
      {
        title: '▶ 実行', color: 'text-indigo-400', items: [
          { keys: ['Ctrl', 'Enter'], desc: 'コンパイル&実行 (テストケースタブなら全テスト実行)' },
          { keys: ['Alt', 'Shift', 'F'], desc: 'コードを自動フォーマット' },
        ]
      },
      {
        title: '✏️ 編集', color: 'text-emerald-400', items: [
          { keys: ['Ctrl', 'Z'], desc: '元に戻す' },
          { keys: ['Ctrl', 'Y'], desc: 'やり直し' },
          { keys: ['Ctrl', 'D'], desc: '現在の行を下に複製' },
          { keys: ['Ctrl', '/'], desc: 'コメント / アンコメント' },
          { keys: ['Alt', '↑ / ↓'], desc: '行を上/下に移動' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: '現在の行を削除' },
          { keys: ['Ctrl', 'G'], desc: '指定行へジャンプ...' },
          { keys: ['Tab'], desc: 'インデント (入力エリア: スペース2つ挿入)' },
          { keys: ['Shift', 'Tab'], desc: 'アンインデント' },
        ]
      },
      {
        title: '🔍 検索', color: 'text-yellow-400', items: [
          { keys: ['Ctrl', 'F'], desc: '検索バーを開く' },
          { keys: ['Ctrl', 'H'], desc: '検索と置換' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: 'コマンドパレット' },
        ]
      },
      {
        title: '🖥️ UI', color: 'text-violet-400', items: [
          { keys: ['?'], desc: 'ショートカットモーダルを開閉' },
          { keys: ['Esc'], desc: 'モーダル/パネルを閉じる' },
        ]
      },
      {
        title: '📱 モバイル (タッチ)', color: 'text-orange-400', items: [
          { keys: ['長押し'], desc: '単語を選択し、ドラッグして選択範囲を拡張' },
          { keys: ['コピーボタン'], desc: 'コード全体、または選択範囲をコピー' },
        ]
      },
    ],
    tipLabel: 'ヒント:',
    tip: 'Monaco EditorはVS Codeのショートカットをほぼすべてサポートしています。コマンドパレット (Ctrl+Shift+P) でさらに多くのコマンドを探せます。',
  },

  testCasesPage: {
    title: 'テストケース', subtitle: 'テストセットの作成、自動Pass/Fail採点、エクスポート/インポート。',
    s1: { title: '1. テストケースモードに切り替え', paras: ['ヘッダーの Test Cases タブをクリック。', '右パネルがテストケース一覧に切り替わります。'] },
    s2: { title: '2. テストケースを追加', paras: ['パネルヘッダーの Add ボタンをクリック。', 'モーダルに入力:'], fields: [{ name: 'Label', desc: 'テスト名 (例: "Test 1 - Small")' }, { name: 'Input (stdin)', desc: 'プログラムに渡す入力' }, { name: 'Expected Output', desc: 'Pass/Fail採点の期待出力' }], note: 'Expected Outputが空の場合、実行はされますが採点されません (常に✓)。' },
    s3: { title: '3. テストを実行', actions: [{ label: 'Run All', desc: 'すべて並列実行。結果はすぐに表示。' }, { label: '▶', desc: 'カード内の▶アイコン — そのテストのみ実行。' }, { label: 'Reset', desc: '結果をクリアしてidle状態に戻す。' }] },
    s4: { title: '4. 結果を確認', statuses: [{ label: 'Pass', color: 'text-green-400', desc: '出力が期待出力と一致 (末尾の空白は無視)。' }, { label: 'Fail', color: 'text-red-400', desc: '出力が不一致 — カードをクリックしてdiffを確認。' }, { label: 'Error', color: 'text-orange-400', desc: 'コンパイルエラーまたは実行エラー。' }, { label: 'Timeout', color: 'text-yellow-400', desc: '制限時間を超過。' }] },
    s5: { title: '5. テストケースを複製', paras: ['カード内のコピーアイコンをクリックして直下に複製。', '類似テストを複数作成する際に便利。'] },
    s6: { title: '6. エクスポート/インポート', export: { label: 'Export — testcases.jsonをダウンロード', desc: 'クリーンなJSON形式、IDなし、手動編集やスクリプト生成が容易。' }, import: { label: 'Import — .jsonファイルを選択', desc: 'テストセットを読み込み、現在のテストをすべて置換。IDは新たに生成。' }, formatLabel: 'JSONファイル形式:' },
    proTip: 'Pro tip: PythonスクリプトでテストセットをJSONとして生成 → エディタにインポート。各テストケースは3フィールドのオブジェクト: label, input, expectedOutput。',
  },

  tipsPage: {
    title: 'CPのヒントとテンプレート', subtitle: '競技プログラミング向けのヒントとテンプレート。',
    s1: { title: '📚 テンプレートパネルの使い方', paras: ['コードエディタのペインバーにある Templates アイコンをクリック。', 'パネルが左からスライドアウト — 検索してテンプレートを選び「エディタに挿入」。', '利用可能なテンプレート:'], insertLabel: 'エディタに挿入' },
    s2: { title: '⚡ Fast I/O — main() の先頭に必ず追加', desc: 'C stdioとC++ streamsの同期を無効化。大きな入力でcin/coutを使う際に必須 — 結果の正確性には影響しません。' },
    s3: { title: '🔧 よく使うトリック', tricks: [{ title: '高速入力読み取り' }, { title: "高速出力 — endlの代わりに'\\n'" }, { title: 'PairとTuple' }, { title: 'sort用ラムダ比較関数' }, { title: 'GCD / LCM (C++17)' }, { title: 'ビット操作トリック' }] },
    s4: { title: '⏱️ TLE対策最適化', tips: ['ヘッダーで-O2最適化を有効化 — 2〜5倍高速化。', 'Fast I/O後もまだ遅い場合はprintf/scanfを使用。', "endlを避け、'\\n'を使用。", 'サイズが既知の場合はvectorにreserve()。', '順序が不要な場合はmapの代わりにunordered_mapを使用 (O(1) vs O(log n))。', '遅いソリューションをテストする場合はSettingsでタイムアウトを増加。'] },
    s5: { title: '📊 計算量の目安', rows: [{ n: '10⁸ operations', time: '~1s', note: '一般的なOJの制限時間' }, { n: 'n ≤ 10⁶', time: 'O(n log n)', note: 'ソート, BIT, セグメントツリー' }, { n: 'n ≤ 10⁵', time: 'O(n log²n)', note: 'マージソートツリー, オフライン' }, { n: 'n ≤ 5000', time: 'O(n²)', note: '基本的な2D DP' }, { n: 'n ≤ 500', time: 'O(n³)', note: 'Floyd-Warshall, 行列連鎖' }, { n: 'n ≤ 20', time: 'O(2ⁿ)', note: 'ビットマスクDP' }] },
    s6: { title: '🤖 自定義関数のIntelliSense', paras: ['エディタは記述した関数を自動検出し、以下を提供:'], features: [{ label: 'オートコンプリート', desc: '— 関数名を入力するとドロップダウンが表示' }, { label: 'パラメータヒント', desc: '— funcName( と入力するとパラメータ名のツールチップが表示' }, { note: 'すべての言語で動作: C++, C, Python' }] },
  },

  shortcutsModal: {
    title: 'キーボードショートカット', footer: '? または Esc を押して閉じる',
    sections: [
      { title: '実行', items: [{ keys: ['Ctrl', 'Enter'], desc: 'コンパイル&実行 (テストケースタブなら全テスト)' }, { keys: ['Alt', 'Shift', 'F'], desc: 'コードをフォーマット' }] },
      { title: 'エディタ', items: [{ keys: ['Ctrl', 'Z'], desc: '元に戻す' }, { keys: ['Ctrl', 'Y'], desc: 'やり直し' }, { keys: ['Ctrl', 'D'], desc: '現在の行を複製' }, { keys: ['Ctrl', '/'], desc: 'コメント切替' }, { keys: ['Ctrl', 'F'], desc: 'コード内検索' }, { keys: ['Ctrl', 'H'], desc: '検索と置換' }, { keys: ['Ctrl', 'G'], desc: '行番号へジャンプ...' }, { keys: ['Alt', '↑/↓'], desc: '行を上/下に移動' }, { keys: ['Ctrl', 'Shift', 'K'], desc: '現在の行を削除' }, { keys: ['Tab'], desc: 'インデント' }, { keys: ['Shift', 'Tab'], desc: 'アンインデント' }] },
      { title: 'UI', items: [{ keys: ['?'], desc: 'ショートカットモーダルを開閉' }, { keys: ['Ctrl', 'Shift', 'P'], desc: 'コマンドパレット' }] },
      { title: 'モバイル (タッチ)', items: [{ keys: ['長押し'], desc: '単語を選択し、ドラッグで拡張' }, { keys: ['コピーボタン'], desc: 'コード全体または選択範囲をコピー' }] },
    ],
  },

  header: {
    openInput: 'input.txtを開く',
    download: 'ファイルをダウンロード',
    filenamePrompt: 'ファイル名:',
    downloadSuccess: (name: string) => `${name} をダウンロードしました`,
  },

  settings: {
    showWarningsDesc: 'コンパイル警告 (黄色) をErrorsタブに表示 — 無効にするとエラーのみ表示',
    runTimeoutDesc: '制限時間を超えたらプログラムを停止',
    themes: [
      { value: 'vs-dark', label: 'VS Dark', desc: 'デフォルト — ダーク背景' },
      { value: 'vs', label: 'VS Light', desc: 'ライト背景' },
      { value: 'hc-black', label: 'High Contrast', desc: 'ハイコントラスト、読みやすい' },
    ],
    title: 'エディタ設定',
    savedAutomatically: '設定は自動保存されます',
    sections: {
      intellisense: 'IntelliSense',
      display: '表示',
      typography: 'フォント',
      theme: 'テーマ',
      execution: '実行',
    },
    toggles: {
      suggestions: { label: '補完を有効化', desc: 'オートコンプリートのマスタートグル' },
      quickSuggestions: { label: 'インライン補完', desc: '入力中に補完を表示 (トリガー不要)' },
      parameterHints: { label: 'パラメータヒント', desc: "'(' 入力時に関数シグネチャを表示" },
      snippets: { label: 'スニペット', desc: 'スニペットテンプレートを有効化 (fori, bfs, dfs, dp...)' },
      minimap: { label: 'ミニマップ', desc: '右マージンにコードの概要を表示' },
      wordWrap: { label: '自動折り返し', desc: '長い行を折り返す (横スクロールなし)' },
      lineNumbers: { label: '行番号', desc: '余白に行番号を表示' },
      bracketPairColorization: { label: 'ブラケットの色付け', desc: '対応するカッコをカラーで表示' },
      renderWhitespace: { label: '空白の表示', desc: '選択範囲のスペースをドットで表示' },
      showWarnings: { label: '警告を表示', desc: 'コンパイル警告をErrorsタブに表示' },
      fontLigatures: { label: 'フォントリガチャ', desc: 'リガチャを有効化 (→, ≥, != など)' },
      smoothCaret: { label: 'スムーズカーソル', desc: 'カーソル移動にアニメーションを追加' }, useWasm: { label: 'ブラウザで実行 (WASM)', desc: 'コードをローカルで実行（サーバー負荷ゼロ、オフライン対応）' },
    },
    fontSize: 'フォントサイズ',
    tabSize: 'タブサイズ',
    runTimeout: '実行タイムアウト',
  },

  output: {
    clearOutput: '出力をクリア',
    compiling: 'コンパイルと実行中...',
    runHint: 'Run または Ctrl+Enter を押してコンパイル',
    timeout: '⏱ タイムアウトによりプログラムを停止しました。',
    noRuns: 'まだ実行されていません',
    copy: 'コピー',
    infoLabels: { compile: 'コンパイル', exitCode: '終了コード', runtime: '実行時間', timeout: 'タイムアウト', warnings: '警告' },
    infoValues: { failed: '❌ 失敗', success: '✅ 成功', na: 'N/A', yes: '⚠️ あり', no: 'なし', shown: '表示', hidden: '非表示', none: 'なし' },
    historyStatus: { timeout: 'タイムアウト', error: 'エラー', ok: 'OK' },
  },

  testCasePanel: {
    resetResults: 'すべての結果をリセット',
    addTestCase: 'テストケースを追加',
    runAll: 'すべて実行',
    editTestCase: 'テストケースを編集',
    runThis: 'このテストを実行',
    duplicated: (label: string) => `"${label}" を複製しました`,
    exportedN: (n: number) => `${n}件のテストケースをエクスポートしました!`,
    exportError: 'テストケースをエクスポートできません。',
    importedN: (n: number) => `${n}件のテストケースをインポートしました!`,
    importError: '無効なファイル。JSON形式が必要: [{label, input, expectedOutput}]',
  },

  testCaseModal: {
    inputPlaceholder: 'このテストケースの入力を入力...\n(cin / sys.stdin に渡されます)',
    outputPlaceholder: '期待出力を入力...\n(実行後のPass/Fail判定に使用)',
    emptyOutputNote: '空白 = 採点なし',
  },

  codeEditor: {
    copySelection: '選択範囲をコピー',
    copyAll: 'コード全体をコピー',
  },

  editorLayout: {
    compilingToast: '⚙ コンパイル中…',
    compileError: '❌ コンパイルエラー!',
    timeoutWarning: '⏱ タイムアウト!',
    cannotConnect: 'サーバーに接続できません。',
    batchCompiling: '⚙ コンパイル中…',
    batchRunning: (n: number) => `▶ ${n}件のテストケースを実行中…`,
    sharedBanner: '共有コードを表示中 — 変更は保存されません。',
    editorSettings: 'エディタ設定',
    inputPlaceholder: 'stdinをここに入力...\n(内容はcinに渡されます)',
  },

  templatesPanel: {
    searchPlaceholder: 'テンプレートを検索...',
    insertButton: 'エディタに挿入',
  },

  sharedPage: {
    decoding: '共有リンクのデータを解析中...',
    decodeError: '解析エラー',
    goHome: 'メインページへ',
  },

  ui: {
    run: '実行',
    runAll: 'すべて実行',
    singleRun: '単体実行',
    format: 'フォーマット',
    copy: 'コピー',
    clear: 'クリア',
    input: '入力',
    optimize: '最適化',
    tabs: {
      output: '出力',
      errors: 'エラー',
      info: '情報',
      history: '履歴',
      code: 'コード',
      input: '入力',
      tests: 'テスト',
    },
    badges: {
      compileError: 'コンパイルエラー',
      warning: '警告',
      timeout: 'タイムアウト',
      runtimeStderr: '実行時エラー',
    },
    nRecentRuns: (n: number) => `最近の${n}回の実行 (このセッション)`,
    close: '閉じる',
    undo: '元に戻す (Ctrl+Z)',
    redo: 'やり直し (Ctrl+Y)',
    shareLink: '共有リンクを作成 (fflate圧縮)',
    exportTestCases: 'テストケースをエクスポート (.json)',
    importTestCases: 'テストケースをインポート (.json)',
    duplicateTestCase: 'テストケースを複製',
    templatesTitle: 'テンプレート CP (Ctrl+T)',
    shortcutsTitle: 'キーボードショートカット (?)',
    optimizeOn: '最適化 (-O2) — クリックでFastに切替',
    optimizeOff: '高速 (-O0) — クリックでOptimizeに切替',
    srcHints: { cpp: 'C++ ソース', c: 'C ソース', python: 'Python ソース' },
    fileHints: { stdin: '標準入力 (stdin)', stdout: '標準出力 (stdout)' },
  },
};
