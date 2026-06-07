/**
 * lib/i18n/ja.ts — Japanese
 */
import type { Translations } from './types';

export const ja: Translations = {

  guide: {
    navLabel:     'ガイド',
    backToEditor: '← エディタに戻る',
    overview:     '概要',
    shortcuts:    'ショートカット',
    testCases:    'テストケース',
    cpTips:       '競プロのヒント',
  },

  overview: {
    title:    'CppEditor ガイド',
    subtitle: 'C++20、C++17、C11、Python 3 をサポートするオンラインコンパイラ — 競技プログラミング向けに最適化されています。下のトピックを選んで始めましょう。',
    cards: [
      { title: 'キーボードショートカット', desc: 'Ctrl+Enter、Ctrl+Shift+F、? など、素早くコードを書くためのショートカット集です。' },
      { title: 'テストケース',         desc: 'テストセットの作成・実行・エクスポート/インポートを、プロのように使いこなせます。' },
      { title: '競プロのヒント & テンプレート', desc: 'DSU、セグメントツリー、Dijkstra などのテンプレートを 1 回クリックで挿入できます。' },
    ],
    featuresTitle: '機能ハイライト',
    features: [
      { title: '高速なコンパイル & 実行',   desc: 'WebSocket ストリーミング — 出力が1行ずつ表示され、待ち時間がありません。' },
      { title: 'テストケースエンジン',     desc: '自動の Pass/Fail 判定、期待出力との比較、並列実行に対応しています。' },
      { title: '共有リンク',           desc: 'コード + 入力を短縮URLで共有 — 開いた人はあなたと同じ内容をそのまま見られます。' },
      { title: '充実した IntelliSense',    desc: '自作関数の候補表示、引数ヒント、STL 補完に対応しています。' },
      { title: '細かなカスタマイズ',   desc: 'フォント、テーマ、タイムアウト、警告、IntelliSense などを設定で変更できます。' },
    ],
    quickStartTitle: '⚡ クイックスタート',
    quickStartSteps: [
      [' ', { tag: 'link', text: 'メインページ' }, ' を開き、右上で言語を選択します。'],
      ['左側の ', { tag: 'code', text: 'main.cpp' }, ' パネルにコードを入力します。'],
      [' ', { tag: 'kbd',  text: 'Ctrl+Enter' }, ' または ', { tag: 'em', text: '▶ 実行' }, ' ボタンを押して実行します。'],
      ['右側の ', { tag: 'code', text: 'Output' }, ' パネルで結果を確認します。'],
      [' ', { tag: 'em', text: 'テストケース' }, ' タブを開いてテストセットを作成し、自動採点します。'],
    ],
  },

  shortcutsPage: {
    title:    'キーボードショートカット',
    subtitle: 'エディタでいつでも ? を押すと、この一覧をすぐに表示できます。',
    sections: [
      {
        title: '▶ コード実行', color: 'text-indigo-400',
        items: [
          { keys: ['Ctrl', 'Enter'],      desc: 'コンパイルして実行 — テストケースタブでは「すべて実行」' },
          { keys: ['Ctrl', 'Shift', 'F'], desc: 'コードを自動整形' },
        ],
      },
      {
        title: '✏️ 編集', color: 'text-emerald-400',
        items: [
          { keys: ['Ctrl', 'Z'],          desc: '元に戻す' },
          { keys: ['Ctrl', 'Y'],          desc: 'やり直し(または Ctrl+Shift+Z)' },
          { keys: ['Ctrl', 'D'],          desc: '現在の行を下に複製' },
          { keys: ['Ctrl', '/'],          desc: '行をコメント / コメント解除(//...)' },
          { keys: ['Alt', '↑ / ↓'],       desc: '行を上 / 下へ移動' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: '現在の行を削除' },
          { keys: ['Ctrl', 'G'],          desc: '指定行へ移動...' },
          { keys: ['Tab'],                desc: 'インデント — 入力欄では 2 つのスペースを挿入' },
          { keys: ['Shift', 'Tab'],       desc: 'インデント解除' },
        ],
      },
      {
        title: '🔍 検索', color: 'text-yellow-400',
        items: [
          { keys: ['Ctrl', 'F'],          desc: 'コード内検索バーを開く' },
          { keys: ['Ctrl', 'H'],          desc: '検索と置換' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: 'コマンドパレット — Monaco の任意のコマンドを探す' },
        ],
      },
      {
        title: '🖥️ UI', color: 'text-violet-400',
        items: [
          { keys: ['?'],   desc: 'このショートカットモーダルを開く / 閉じる' },
          { keys: ['Esc'], desc: 'モーダルを閉じる / パネルを開く' },
        ],
      },
      {
        title: '📱 モバイル(タッチ)', color: 'text-orange-400',
        items: [
          { keys: ['Long press (hold)'],   desc: '指の下の単語を選択し、ドラッグで範囲を広げる' },
          { keys: ['Copy (toolbar)'],      desc: 'コード全体、または選択範囲をコピー' },
        ],
      },
    ],
    tipLabel: 'ヒント:',
    tip: 'Monaco Editor は VS Code のほとんどのショートカットに対応しています。コマンドパレット(Ctrl+Shift+P)を開くと、ほかのコマンドも見つけられます。',
  },

  testCasesPage: {
    title:    'テストケース',
    subtitle: 'テストセットの作成、自動 Pass/Fail 判定、エクスポート/インポートに対応。',
    s1: {
      title: '1. テストケースモードに切り替える',
      paras: [
        '左上のヘッダーで「テストケース」タブをクリックします(または Ctrl+Enter で全テストを実行します)。',
        '右側パネルがステータスバッジ付きのテストケース一覧に切り替わります。',
      ],
    },
    s2: {
      title: '2. テストケースを追加する',
      paras: ['テストケースパネルのヘッダーにある「追加」ボタンをクリックします。', 'モーダルが開いたら、次を入力します:'],
      fields: [
        { name: 'ラベル',           desc: 'テスト名(例: "Test 1 - Small")' },
        { name: '入力 (stdin)',   desc: 'プログラムへ渡す入力内容' },
        { name: '期待出力', desc: 'Pass/Fail 判定に使う期待結果' },
      ],
      note: '期待出力が空でもテストは実行されますが、常に ✓ が表示されます(採点なし)。',
    },
    s3: {
      title: '3. テストを実行する',
      actions: [
        { label: 'すべて実行', desc: 'すべてのテストケースを並列で実行します。結果はすぐに表示されます。' },
        { label: '▶',       desc: '各テストカードにある小さな ▶ アイコン — そのテストだけを実行します。' },
        { label: 'リセット',   desc: 'すべての結果を消去し、アイドル状態に戻します(実行後に表示されます)。' },
      ],
    },
    s4: {
      title: '4. 結果を読む',
      statuses: [
        { label: 'Pass',    color: 'text-green-400',  desc: '出力が期待出力と一致(末尾の空白は無視)。' },
        { label: 'Fail',    color: 'text-red-400',    desc: '出力が期待出力と異なる — カードをクリックすると差分を確認できます。' },
        { label: 'Error',   color: 'text-orange-400', desc: 'コンパイルエラーまたは実行時エラー(終了コード ≠ 0)。' },
        { label: 'Timeout', color: 'text-yellow-400', desc: 'プログラムが制限時間を超えました。' },
      ],
    },
    s5: {
      title: '5. テストケースを複製する',
      paras: [
        'カードのコピーアイコンをクリックすると、直下に複製を作成できます。',
        '似たテストをたくさん作るときに便利です(入力の一部だけを少し変える)。',
      ],
    },
    s6: {
      title: '6. テストセットをエクスポート / インポートする',
      export: { label: 'エクスポート — testcases.json をダウンロード', desc: 'きれいな JSON 形式で、ID は含まれません。手動編集やスクリプト生成もしやすいです。' },
      import: { label: 'インポート — ディスクから .json ファイルを選択', desc: 'テストセットを読み込み、現在のテストをすべて置き換えます。ID は新しく生成されます。' },
      formatLabel: 'JSON ファイル形式:',
    },
    proTip: 'プロのヒント: Python スクリプトで大量のテストセットを生成 → JSON をエクスポート → エディタにインポートすると便利です。各テストケースは label, input, expectedOutput の 3 フィールドを持つ 1 つのオブジェクトです。',
  },

  tipsPage: {
    title:    '競プロのヒント & テンプレート',
    subtitle: '競技プログラミング向けのヒントとテンプレートです。',
    s1: {
      title: '📚 テンプレートパネルの使い方',
      paras: [
        'コードエディタのパネルバーにあるテンプレートアイコンをクリックします。',
        'パネルが左からスライド表示されるので、テンプレートを検索して選び、「エディタに挿入」をクリックします。',
        '利用可能なテンプレート:',
      ],
      insertLabel: 'エディタに挿入',
    },
    s2: {
      title: '⚡ 高速 I/O — main() の先頭に必ず追加',
      desc:  'C の標準入出力と C++ のストリームの同期を切ります。cin/cout で大きな入力を扱うときに必要で、正しさには影響しません。',
    },
    s3: {
      title: '🔧 よく使うテクニック',
      tricks: [
        { title: '高速入力' },
        { title: "高速出力 — endl ではなく '\n' を使う" },
        { title: 'pair と tuple' },
        { title: 'sort 用のラムダ比較関数' },
        { title: 'GCD / LCM(C++17)' },
        { title: 'ビット演算テクニック' },
      ],
    },
    s4: {
      title: '⏱️ TLE 対策',
      tips: [
        'ヘッダーで -O2 最適化を有効にする(ヘッダーバーで切り替え) — 2〜5倍速くなることがあります。',
        '高速 I/O でも遅い場合は printf/scanf を使う。',
        "endl は避け、代わりに '\n' を使う。",
        'サイズが事前に分かっているなら vector に reserve() を使う。',
        '順序が不要なら map ではなく unordered_map を使う(O(1) vs O(log n))。',
        '遅い解法を試す必要があるなら Settings でタイムアウトを増やす。',
      ],
    },
    s5: {
      title: '📊 計算量の目安',
      rows: [
        { n: '10⁸ operations', time: '~1s',          note: '典型的な OJ の制限時間' },
        { n: 'n ≤ 10⁶',        time: 'O(n log n)',   note: 'ソート、BIT、セグメントツリー' },
        { n: 'n ≤ 10⁵',        time: 'O(n log²n)',   note: 'マージソート木、オフライン処理' },
        { n: 'n ≤ 5000',       time: 'O(n²)',         note: '基本的な 2D DP' },
        { n: 'n ≤ 500',        time: 'O(n³)',         note: 'Floyd-Warshall、行列連鎖' },
        { n: 'n ≤ 20',         time: 'O(2ⁿ)',         note: 'ビットマスク DP' },
      ],
    },
    s6: {
      title: '🤖 ユーザー定義関数の IntelliSense',
      paras: ['エディタは、あなたが書いた関数を自動検出して次を提供します:'],
      features: [
        { label: 'オートコンプリート',     desc: '— 関数名を入力すると候補のドロップダウンが表示されます' },
        { label: '引数ヒント',  desc: '— funcName( と入力すると、各引数名のツールチップが表示されます' },
        { note: 'すべての言語で動作します: C++, C, Python' },
      ],
    },
  },

  shortcutsModal: {
    title:  'キーボードショートカット',
    footer: '閉じるには ? または Esc を押してください',
    sections: [
      {
        title: 'コード実行',
        items: [
          { keys: ['Ctrl', 'Enter'],      desc: 'コンパイルして実行(テストケースタブでは Run All)' },
          { keys: ['Ctrl', 'Shift', 'F'], desc: 'コードを整形(自動 beautify)' },
        ],
      },
      {
        title: 'エディタ',
        items: [
          { keys: ['Ctrl', 'Z'],          desc: '元に戻す' },
          { keys: ['Ctrl', 'Y'],          desc: 'やり直し' },
          { keys: ['Ctrl', 'D'],          desc: '現在の行を複製' },
          { keys: ['Ctrl', '/'],          desc: '行をコメント / コメント解除' },
          { keys: ['Ctrl', 'F'],          desc: 'コード内検索' },
          { keys: ['Ctrl', 'H'],          desc: '検索と置換' },
          { keys: ['Ctrl', 'G'],          desc: '指定行へ移動...' },
          { keys: ['Alt', '↑/↓'],         desc: '行を上/下に移動' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: '現在の行を削除' },
          { keys: ['Tab'],                desc: 'インデント(入力欄では 2 つのスペースを挿入)' },
          { keys: ['Shift', 'Tab'],       desc: 'インデント解除' },
        ],
      },
      {
        title: 'UI',
        items: [
          { keys: ['?'],                  desc: 'このショートカットモーダルを開く / 閉じる' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: 'コマンドパレット(任意の Monaco コマンドを検索)' },
        ],
      },
      {
        title: 'モバイル(タッチ)',
        items: [
          { keys: ['Long press'],  desc: '単語を選択し、ドラッグで範囲を広げる' },
          { keys: ['Copy button'], desc: 'コード全体、または選択範囲をコピー' },
        ],
      },
    ],
  },

  header: {
    openInput:       'input.txt を開く',
    download:        'ファイルをダウンロード',
    filenamePrompt:  'ファイル名:',
    downloadSuccess: (name: string) => `${name} をダウンロードしました`,
  },

  settings: {
    showWarningsDesc: 'コンパイラ警告(黄色)を Errors タブに表示 — 無効にするとエラーのみ表示します',
    runTimeoutDesc:   '実行時間が制限時間を超えたら停止します',
    themes: [
      { value: 'vs-dark',  label: 'VS Dark',       desc: '標準 — 暗い背景' },
      { value: 'vs',       label: 'VS Light',      desc: '明るい背景' },
      { value: 'hc-black', label: 'High Contrast', desc: '高コントラストで読みやすい' },
    ],
  },

  output: {
    clearOutput: '出力を消去',
    compiling:   'コンパイルして実行中...',
    runHint:     '実行ボタンまたは Ctrl+Enter でコンパイルします',
    timeout:     '⏱ プログラムはタイムアウトにより停止しました。',
    noRuns:      'まだ実行がありません',
  },

  testCasePanel: {
    resetResults: 'すべての結果をアイドル状態に戻す',
    addTestCase:  'テストケースを追加',
    runAll:       'すべて実行',
    editTestCase: 'テストケースを編集',
    runThis:      'このテストを実行',
    duplicated:   (label: string) => `"${label}" を複製しました`,
    exportedN:    (n: number) => `${n} 個のテストケースをエクスポートしました！`,
    exportError:  'テストケースをエクスポートできません。',
    importedN:    (n: number) => `${n} 個のテストケースをインポートしました！`,
    importError:  '無効なファイルです。JSON 形式 [{label, input, expectedOutput}] が必要です。',
  },

  testCaseModal: {
    inputPlaceholder:  'このテストケースの入力を入力してください...\n(cio / sys.stdin に渡されます)',
    outputPlaceholder: '期待出力を入力してください...\n(実行後の Pass/Fail 比較に使用されます)',
    emptyOutputNote:   '空欄 = 採点なし',
  },

  codeEditor: {
    copySelection: '選択範囲をコピー',
    copyAll:       'コード全体をコピー',
  },

  editorLayout: {
    compilingToast:   '⚙ コンパイル中…',
    compileError:     '❌ コンパイルエラー！',
    timeoutWarning:   '⏱ タイムアウト！',
    cannotConnect:    'サーバーに接続できません。',
    batchCompiling:   '⚙ コンパイル中…',
    batchRunning:     (n: number) => `▶ ${n} 個のテストケースを実行中…`,
    sharedBanner:     '共有コードを表示中 — 変更は保存されません。',
    editorSettings:   'エディタ設定',
    inputPlaceholder: 'ここに stdin を入力...\n(内容は cin に渡されます)',
  },

  templatesPanel: {
    searchPlaceholder: 'テンプレートを検索...',
    insertButton:      'エディタに挿入',
  },

  sharedPage: {
    decoding:    '共有リンクデータをデコード中...',
    decodeError: 'デコードエラー',
    goHome:      'メインページへ戻る',
  },


};
