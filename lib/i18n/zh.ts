/**
 * lib/i18n/zh.ts — 中文 (简体)
 */
import type { Translations } from './types';

export const zh: Translations = {
  guide: {
    navLabel: '指南',
    backToEditor: '← 返回编辑器',
    overview: '概述',
    shortcuts: '快捷键',
    testCases: '测试用例',
    cpTips: 'CP 技巧',
  },

  overview: {
    title: 'CppEditor 使用指南',
    subtitle: '支持 C++20、C++17、C11 和 Python 3 的在线编译器 — 专为竞技编程优化。选择下方主题开始使用。',
    cards: [
      { title: '键盘快捷键', desc: 'Ctrl+Enter、Alt+Shift+F、? 等所有快捷键，让编码更高效。' },
      { title: '测试用例', desc: '创建、运行、导出/导入测试集 — 像专业人士一样测试。' },
      { title: 'CP 技巧与模板', desc: 'DSU、线段树、Dijkstra 模板 — 一键插入编辑器。' },
    ],
    featuresTitle: '功能亮点',
    features: [
      { title: '快速编译运行', desc: 'WebSocket 流式传输 — 输出逐行实时显示，无需等待。' },
      { title: '测试用例引擎', desc: '自动 Pass/Fail 评测，期望输出对比，并行运行。' },
      { title: '分享链接', desc: '通过短链接分享代码+输入 — 任何人打开都能看到相同内容。' },
      { title: '完整 IntelliSense', desc: '自定义函数补全、参数提示、STL 补全。' },
      { title: '深度自定义', desc: '字体、主题、超时、警告、IntelliSense — 均可在设置中调整。' },
    ],
    quickStartTitle: '⚡ 快速开始',
    quickStartSteps: [
      ['打开', { tag: 'link' as const, text: '主页' }, '，在右上角选择语言。'],
      ['在左侧', { tag: 'code' as const, text: 'main.cpp' }, '面板中输入代码。'],
      ['按', { tag: 'kbd' as const, text: 'Ctrl+Enter' }, '或点击', { tag: 'em' as const, text: '▶ 运行' }, '按钮执行。'],
      ['在右侧', { tag: 'code' as const, text: '输出' }, '面板查看结果。'],
      ['打开', { tag: 'em' as const, text: '测试用例' }, '选项卡创建测试集并自动评测。'],
    ],
  },

  shortcutsPage: {
    title: '键盘快捷键',
    subtitle: '在编辑器中随时按 ? 快速查看此列表。',
    sections: [
      {
        title: '▶ 运行代码', color: 'text-indigo-400',
        items: [
          { keys: ['Ctrl', 'Enter'], desc: '编译并运行 — 若在测试用例选项卡则运行全部' },
          { keys: ['Alt', 'Shift', 'F'], desc: '自动格式化所有代码' },
        ],
      },
      {
        title: '✏️ 编辑', color: 'text-emerald-400',
        items: [
          { keys: ['Ctrl', 'Z'], desc: '撤销' },
          { keys: ['Ctrl', 'Y'], desc: '重做 (或 Ctrl+Shift+Z)' },
          { keys: ['Ctrl', 'D'], desc: '向下复制当前行' },
          { keys: ['Ctrl', '/'], desc: '注释 / 取消注释 (//...)' },
          { keys: ['Alt', '↑ / ↓'], desc: '将整行上移 / 下移' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: '删除当前行' },
          { keys: ['Ctrl', 'G'], desc: '跳转到指定行...' },
          { keys: ['Tab'], desc: '缩进 — 在输入区域：插入 2 个空格' },
          { keys: ['Shift', 'Tab'], desc: '取消缩进' },
        ],
      },
      {
        title: '🔍 搜索', color: 'text-yellow-400',
        items: [
          { keys: ['Ctrl', 'F'], desc: '在代码中打开搜索栏' },
          { keys: ['Ctrl', 'H'], desc: '查找和替换' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: '命令面板 — 查找任意 Monaco 命令' },
        ],
      },
      {
        title: '🖥️ 界面', color: 'text-violet-400',
        items: [
          { keys: ['?'], desc: '打开 / 关闭此快捷键弹窗' },
          { keys: ['Esc'], desc: '关闭弹窗 / 面板' },
        ],
      },
      {
        title: '📱 移动端 (触控)', color: 'text-orange-400',
        items: [
          { keys: ['长按'], desc: '选中手指下的单词，拖动以扩展选区' },
          { keys: ['复制 (工具栏)'], desc: '复制全部代码或已选区域' },
        ],
      },
    ],
    tipLabel: '提示：',
    tip: 'Monaco 编辑器支持大多数 VS Code 快捷键。打开命令面板 (Ctrl+Shift+P) 可查找更多命令。',
  },

  testCasesPage: {
    title: '测试用例',
    subtitle: '创建测试集，自动 Pass/Fail 评测，导出/导入。',
    s1: {
      title: '1. 切换到测试用例模式',
      paras: [
        '在左上角标题栏点击「测试用例」选项卡(或按 Ctrl+Enter 运行所有测试)。',
        '右侧面板将切换为带状态标签的测试用例列表。',
      ],
    },
    s2: {
      title: '2. 添加测试用例',
      paras: ['点击测试用例面板标题栏的「添加」按钮。', '在弹出的对话框中填写：'],
      fields: [
        { name: '标签', desc: '测试名称(如 "测试 1 - 小数据")' },
        { name: '输入 (stdin)', desc: '将传入程序的内容' },
        { name: '期望输出', desc: 'Pass/Fail 评测的预期结果' },
      ],
      note: '若期望输出留空，测试用例仍可运行，但始终显示 ✓(不参与评测)。',
    },
    s3: {
      title: '3. 运行测试',
      actions: [
        { label: '全部运行', desc: '并行运行所有测试用例，结果立即显示。' },
        { label: '▶', desc: '每个测试卡片中的小 ▶ 图标 — 仅运行该测试。' },
        { label: '重置', desc: '清除所有结果，恢复为空闲状态(运行后显示)。' },
      ],
    },
    s4: {
      title: '4. 查看结果',
      statuses: [
        { label: '通过', color: 'text-green-400', desc: '输出与期望一致(忽略末尾空白)。' },
        { label: '失败', color: 'text-red-400', desc: '输出与期望不符 — 点击卡片查看差异。' },
        { label: '错误', color: 'text-orange-400', desc: '编译错误或运行时错误(退出码 ≠ 0)。' },
        { label: '超时', color: 'text-yellow-400', desc: '程序运行超过时间限制。' },
      ],
    },
    s5: {
      title: '5. 复制测试用例',
      paras: [
        '点击卡片中的复制图标，在其正下方创建一份副本。',
        '适合创建多个相似测试(只需修改输入中的小部分)。',
      ],
    },
    s6: {
      title: '6. 导出 / 导入测试集',
      export: { label: '导出 — 下载 testcases.json', desc: '简洁的 JSON 格式，无 ID，便于手动编辑或脚本生成。' },
      import: { label: '导入 — 从磁盘选择 .json 文件', desc: '加载测试集，替换当前所有测试。ID 将重新生成。' },
      formatLabel: 'JSON 文件格式：',
    },
    proTip: '小技巧：使用 Python 脚本生成大型测试集 → 导出 JSON → 导入编辑器。每个测试用例是包含 3 个字段的对象：label、input、expectedOutput。',
  },

  tipsPage: {
    title: 'CP 技巧与模板',
    subtitle: '竞技编程的技巧与模板。',
    s1: {
      title: '📚 使用模板面板',
      paras: [
        '点击代码编辑器面板栏上的「模板」图标。',
        '面板从左侧滑出 — 搜索、选择模板并点击「插入到编辑器」。',
        '可用模板：',
      ],
      insertLabel: '插入到编辑器',
    },
    s2: {
      title: '⚡ 快速 I/O — 始终添加到 main() 开头',
      desc: '禁用 C stdio 与 C++ 流之间的同步。使用 cin/cout 处理大量输入时必须添加 — 不影响结果正确性。',
    },
    s3: {
      title: '🔧 常用技巧',
      tricks: [
        { title: '快速读取输入' },
        { title: "快速输出 — 用 '\\n' 代替 endl" },
        { title: 'Pair 和 Tuple' },
        { title: 'sort 的 Lambda 比较器' },
        { title: 'GCD / LCM (C++17)' },
        { title: '位运算技巧' },
      ],
    },
    s4: {
      title: '⏱️ TLE 优化',
      tips: [
        '在标题栏开启 -O2 优化 — 速度提升 2-5 倍。',
        '如果快速 I/O 后仍然慢，使用 printf/scanf。',
        "避免使用 endl，改用 '\\n'。",
        '如果提前知道大小，对 vector 使用 reserve()。',
        '不需要排序时，用 unordered_map 代替 map(O(1) vs O(log n))。',
        '如需测试较慢的解法，在设置中增加超时时间。',
      ],
    },
    s5: {
      title: '📊 复杂度估算',
      rows: [
        { n: '10⁸ 次操作', time: '~1s', note: '典型 OJ 时间限制' },
        { n: 'n ≤ 10⁶', time: 'O(n log n)', note: '排序、BIT、线段树' },
        { n: 'n ≤ 10⁵', time: 'O(n log²n)', note: '归并排序树、离线算法' },
        { n: 'n ≤ 5000', time: 'O(n²)', note: '基础二维 DP' },
        { n: 'n ≤ 500', time: 'O(n³)', note: 'Floyd-Warshall、矩阵链乘' },
        { n: 'n ≤ 20', time: 'O(2ⁿ)', note: '状态压缩 DP' },
      ],
    },
    s6: {
      title: '🤖 自定义函数的 IntelliSense',
      paras: ['编辑器自动检测您编写的函数并提供：'],
      features: [
        { label: '自动补全', desc: '— 输入函数名，下拉建议随即出现' },
        { label: '参数提示', desc: '— 输入 funcName( 时，工具提示显示每个参数名' },
        { note: '适用于所有语言：C++、C、Python' },
      ],
    },
  },

  shortcutsModal: {
    title: '键盘快捷键',
    footer: '按 ? 或 Esc 关闭',
    sections: [
      {
        title: '运行代码',
        items: [
          { keys: ['Ctrl', 'Enter'], desc: '编译并运行(测试用例选项卡则运行全部)', id: 'run' },
          { keys: ['Alt', 'Shift', 'F'], desc: '格式化代码(自动美化)', id: 'format' },
        ],
      },
      {
        title: '编辑器',
        items: [
          { keys: ['Ctrl', 'Z'], desc: '撤销' },
          { keys: ['Ctrl', 'Y'], desc: '重做' },
          { keys: ['Ctrl', 'D'], desc: '复制当前行' },
          { keys: ['Ctrl', '/'], desc: '注释 / 取消注释' },
          { keys: ['Ctrl', 'F'], desc: '在代码中搜索' },
          { keys: ['Ctrl', 'H'], desc: '查找和替换' },
          { keys: ['Ctrl', 'G'], desc: '跳转到行号...' },
          { keys: ['Alt', '↑/↓'], desc: '上移/下移当前行' },
          { keys: ['Ctrl', 'Shift', 'K'], desc: '删除当前行' },
          { keys: ['Tab'], desc: '缩进(输入区：插入 2 个空格)' },
          { keys: ['Shift', 'Tab'], desc: '取消缩进' },
        ],
      },
      {
        title: '界面',
        items: [
          { keys: ['?'], desc: '打开 / 关闭快捷键弹窗' },
          { keys: ['Ctrl', 'Shift', 'P'], desc: '命令面板(查找任意 Monaco 命令)' },
        ],
      },
      {
        title: '移动端 (触控)',
        items: [
          { keys: ['长按'], desc: '选中单词，拖动以扩展选区' },
          { keys: ['复制键'], desc: '复制全部代码或已选区域' },
        ],
      },
    ],
  },

  header: {
    openInput: '打开 input.txt',
    download: '下载文件',
    filenamePrompt: '文件名：',
    downloadSuccess: (name: string) => `已下载 ${name}`,
  },

  settings: {
    showWarningsDesc: '在错误选项卡中显示编译警告(黄色)— 禁用则仅显示错误',
    runTimeoutDesc: '超过时间限制则停止程序',
    themes: [
      { value: 'vs-dark', label: 'VS 深色', desc: '默认 — 深色背景' },
      { value: 'vs', label: 'VS 浅色', desc: '浅色背景' },
      { value: 'hc-black', label: '高对比度', desc: '高对比度，更易阅读' },
    ],
    title: '编辑器设置',
    savedAutomatically: '设置已自动保存',
    sections: {
      intellisense: '智能感知',
      display: '显示',
      typography: '字体',
      theme: '主题',
      execution: '执行',
    },
    toggles: {
      suggestions: { label: '启用建议', desc: '总开关 — 打开或关闭自动补全' },
      quickSuggestions: { label: '内联快速建议', desc: '输入时显示建议(无需触发)' },
      parameterHints: { label: '参数提示', desc: "输入 '(' 时显示函数签名" },
      snippets: { label: '代码片段', desc: '启用代码模板(fori、bfs、dfs、dp...)' },
      minimap: { label: '缩略图', desc: '在右侧边距显示代码概览' },
      wordWrap: { label: '自动换行', desc: '折叠长行而非横向滚动' },
      lineNumbers: { label: '行号', desc: '在边距显示行号' },
      bracketPairColorization: { label: '括号对着色', desc: '为匹配的括号/圆括号着色' },
      renderWhitespace: { label: '渲染空白', desc: '在选中文本中用点显示空格' },
      showWarnings: { label: '显示警告', desc: '在错误选项卡中显示编译警告(黄色)' },
      fontLigatures: { label: '字体连字', desc: '启用连字(→、≥、!= 等，需 JetBrains Mono)' },
      smoothCaret: { label: '平滑光标动画', desc: '为光标移动添加动画效果' },
      useWasm: { label: '在浏览器中运行 (WASM)', desc: '在本地执行代码（零服务器成本，支持离线）' },
    },
    fontSize: '字体大小',
    tabSize: '缩进大小',
    runTimeout: '运行超时',
  },

  output: {
    clearOutput: '清除输出',
    compiling: '正在编译并运行...',
    runHint: '按运行或 Ctrl+Enter 开始编译',
    timeout: '⏱ 程序因超时已停止。',
    noRuns: '暂无运行记录',
    copy: '复制',
    infoLabels: { compile: '编译', exitCode: '退出码', runtime: '运行时间', timeout: '超时', warnings: '警告' },
    infoValues: { failed: '❌ 失败', success: '✅ 成功', na: 'N/A', yes: '⚠️ 是', no: '否', shown: '已显示', hidden: '已隐藏', none: '无' },
    historyStatus: { timeout: '超时', error: '错误', ok: '正常' },
  },

  testCasePanel: {
    resetResults: '重置所有结果',
    addTestCase: '添加测试用例',
    runAll: '全部运行',
    editTestCase: '编辑测试用例',
    runThis: '运行此测试',
    duplicated: (label: string) => `已复制 "${label}"`,
    exportedN: (n: number) => `已导出 ${n} 个测试用例！`,
    exportError: '无法导出测试用例。',
    importedN: (n: number) => `已导入 ${n} 个测试用例！`,
    importError: '文件无效。需要 JSON 格式：[{label, input, expectedOutput}]',
  },

  testCaseModal: {
    inputPlaceholder: '输入此测试用例的输入内容...\n(将传递给 cin / sys.stdin)',
    outputPlaceholder: '输入期望输出...\n(运行后用于 Pass/Fail 对比)',
    emptyOutputNote: '留空 = 不评测',
  },

  codeEditor: {
    copySelection: '复制已选区域',
    copyAll: '复制全部代码',
  },

  editorLayout: {
    compilingToast: '⚙ 编译中…',
    compileError: '❌ 编译错误！',
    timeoutWarning: '⏱ 超时！',
    cannotConnect: '无法连接到服务器。',
    batchCompiling: '⚙ 编译中…',
    batchRunning: (n: number) => `▶ 正在运行 ${n} 个测试用例…`,
    sharedBanner: '正在查看共享代码 — 更改不会被保存。',
    editorSettings: '编辑器设置',
    inputPlaceholder: '在此输入 stdin...\n(内容将传递给 cin)',
  },

  templatesPanel: {
    searchPlaceholder: '搜索模板...',
    insertButton: '插入到编辑器',
  },

  sharedPage: {
    decoding: '正在解码分享链接数据...',
    decodeError: '解码错误',
    goHome: '返回主页',
  },

  ui: {
    run: '运行',
    runAll: '全部运行',
    singleRun: '单次运行',
    format: '格式化',
    copy: '复制',
    clear: '清除',
    input: '输入',
    optimize: '优化',
    tabs: {
      output: '输出',
      errors: '错误',
      info: '信息',
      history: '历史',
      code: '代码',
      input: '输入',
      tests: '测试',
    },
    badges: {
      compileError: '编译错误',
      warning: '警告',
      timeout: '超时',
      runtimeStderr: '运行时错误',
    },
    nRecentRuns: (n: number) => `最近 ${n} 次运行(本次会话)`,
    close: '关闭',
    undo: '撤销 (Ctrl+Z)',
    redo: '重做 (Ctrl+Y)',
    shareLink: '创建分享链接 (fflate 压缩)',
    exportTestCases: '导出测试用例 (.json)',
    importTestCases: '导入测试用例 (.json)',
    duplicateTestCase: '复制测试用例',
    templatesTitle: '模板 CP (Ctrl+T)',
    shortcutsTitle: '键盘快捷键 (?)',
    optimizeOn: '优化 (-O2) — 点击切换到快速模式',
    optimizeOff: '快速 (-O0) — 点击切换到优化模式',
    srcHints: { cpp: 'C++ 源码', c: 'C 源码', python: 'Python 源码' },
    fileHints: { stdin: '标准输入', stdout: '标准输出' },
  },
};