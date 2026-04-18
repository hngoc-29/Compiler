/**
 * lib/cpp-suggestions.ts
 * Đăng ký C++ completion provider cho Monaco Editor.
 * Bao gồm: snippets, STL, competitive programming templates.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCppSuggestions(monaco: any) {
  // Tránh đăng ký nhiều lần
  if ((window as any).__cppSuggestionsRegistered) return;
  (window as any).__cppSuggestionsRegistered = true;

  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;

  // ── Snippets ───────────────────────────────────────────────
  const snippets = [
    // Templates
    {
      label: 'bits',
      detail: '#include <bits/stdc++.h>',
      insertText: '#include <bits/stdc++.h>\nusing namespace std;\n',
      doc: 'Include tất cả standard headers (competitive programming)',
    },
    {
      label: 'main',
      detail: 'int main() { ... }',
      insertText: [
        '#include <bits/stdc++.h>',
        'using namespace std;',
        '',
        'int main() {',
        '    ios_base::sync_with_stdio(false);',
        '    cin.tie(NULL);',
        '    ${1:// code here}',
        '    return 0;',
        '}',
      ].join('\n'),
      doc: 'Template main với fast I/O',
    },
    {
      label: 'fastio',
      detail: 'ios_base::sync_with_stdio(false); cin.tie(NULL);',
      insertText: 'ios_base::sync_with_stdio(false);\ncin.tie(NULL);',
      doc: 'Fast I/O cho competitive programming',
    },

    // Loops
    {
      label: 'fori',
      detail: 'for (int i = 0; i < n; i++)',
      insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// body}\n}',
      doc: 'For loop tăng dần',
    },
    {
      label: 'forr',
      detail: 'for (int i = n-1; i >= 0; i--)',
      insertText: 'for (int ${1:i} = ${2:n} - 1; ${1:i} >= 0; ${1:i}--) {\n    ${3:// body}\n}',
      doc: 'For loop giảm dần',
    },
    {
      label: 'fore',
      detail: 'for (auto& e : container)',
      insertText: 'for (auto& ${1:e} : ${2:v}) {\n    ${3:// body}\n}',
      doc: 'Range-based for loop',
    },
    {
      label: 'rep',
      detail: '#define rep(i,n)',
      insertText: 'for (int ${1:i} = 0; ${1:i} < (int)(${2:n}); ++${1:i})',
      doc: 'Repeat n lần',
    },
    {
      label: 'while',
      detail: 'while (condition)',
      insertText: 'while (${1:condition}) {\n    ${2:// body}\n}',
      doc: 'While loop',
    },

    // I/O
    {
      label: 'cout',
      detail: 'cout << ... << endl',
      insertText: 'cout << ${1:val} << "\\n";',
      doc: 'Output',
    },
    {
      label: 'cin',
      detail: 'cin >> ...',
      insertText: 'cin >> ${1:var};',
      doc: 'Input',
    },
    {
      label: 'printf',
      detail: 'printf("...", ...)',
      insertText: 'printf("${1:%d}\\n", ${2:val});',
      doc: 'Formatted output',
    },
    {
      label: 'scanf',
      detail: 'scanf("...", ...)',
      insertText: 'scanf("${1:%d}", &${2:var});',
      doc: 'Formatted input',
    },

    // Data structures
    {
      label: 'vi',
      detail: 'vector<int>',
      insertText: 'vector<int> ${1:v}(${2:n});',
      doc: 'Vector of int',
    },
    {
      label: 'vvi',
      detail: 'vector<vector<int>>',
      insertText: 'vector<vector<int>> ${1:g}(${2:n}, vector<int>(${3:m}, ${4:0}));',
      doc: '2D vector',
    },
    {
      label: 'pii',
      detail: 'pair<int,int>',
      insertText: 'pair<int, int> ${1:p} = {${2:a}, ${3:b}};',
      doc: 'Pair of int',
    },
    {
      label: 'mii',
      detail: 'map<int,int>',
      insertText: 'map<int, int> ${1:mp};',
      doc: 'Map int → int',
    },
    {
      label: 'umi',
      detail: 'unordered_map<int,int>',
      insertText: 'unordered_map<int, int> ${1:mp};',
      doc: 'Unordered map (O(1) lookup)',
    },
    {
      label: 'si',
      detail: 'set<int>',
      insertText: 'set<int> ${1:st};',
      doc: 'Set of int',
    },
    {
      label: 'pq',
      detail: 'priority_queue<int>',
      insertText: 'priority_queue<int> ${1:pq};',
      doc: 'Max-heap',
    },
    {
      label: 'pqmin',
      detail: 'priority_queue min-heap',
      insertText: 'priority_queue<int, vector<int>, greater<int>> ${1:pq};',
      doc: 'Min-heap',
    },
    {
      label: 'stack',
      detail: 'stack<int>',
      insertText: 'stack<int> ${1:st};',
      doc: 'Stack',
    },
    {
      label: 'queue',
      detail: 'queue<int>',
      insertText: 'queue<int> ${1:q};',
      doc: 'Queue',
    },
    {
      label: 'deque',
      detail: 'deque<int>',
      insertText: 'deque<int> ${1:dq};',
      doc: 'Double-ended queue',
    },

    // Algorithms
    {
      label: 'sort',
      detail: 'sort(v.begin(), v.end())',
      insertText: 'sort(${1:v}.begin(), ${1:v}.end());',
      doc: 'Sort tăng dần',
    },
    {
      label: 'sortr',
      detail: 'sort descending',
      insertText: 'sort(${1:v}.begin(), ${1:v}.end(), greater<${2:int}>());',
      doc: 'Sort giảm dần',
    },
    {
      label: 'sortl',
      detail: 'sort with lambda',
      insertText: 'sort(${1:v}.begin(), ${1:v}.end(), [](const auto& a, const auto& b) {\n    return ${2:a < b};\n});',
      doc: 'Sort với custom comparator',
    },
    {
      label: 'lb',
      detail: 'lower_bound',
      insertText: 'lower_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})',
      doc: 'Lower bound (binary search)',
    },
    {
      label: 'ub',
      detail: 'upper_bound',
      insertText: 'upper_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})',
      doc: 'Upper bound (binary search)',
    },
    {
      label: 'bs',
      detail: 'binary_search',
      insertText: 'binary_search(${1:v}.begin(), ${1:v}.end(), ${2:val})',
      doc: 'Binary search (trả về bool)',
    },
    {
      label: 'rev',
      detail: 'reverse',
      insertText: 'reverse(${1:v}.begin(), ${1:v}.end());',
      doc: 'Đảo ngược',
    },
    {
      label: 'uniq',
      detail: 'unique + erase',
      insertText: '${1:v}.erase(unique(${1:v}.begin(), ${1:v}.end()), ${1:v}.end());',
      doc: 'Xóa phần tử trùng (cần sort trước)',
    },
    {
      label: 'accum',
      detail: 'accumulate',
      insertText: 'accumulate(${1:v}.begin(), ${1:v}.end(), ${2:0LL})',
      doc: 'Tính tổng',
    },
    {
      label: 'fill',
      detail: 'fill(v.begin(), v.end(), val)',
      insertText: 'fill(${1:v}.begin(), ${1:v}.end(), ${2:0});',
      doc: 'Điền giá trị',
    },

    // Math & Utilities
    {
      label: 'gcd',
      detail: '__gcd(a, b)',
      insertText: '__gcd(${1:a}, ${2:b})',
      doc: 'GCD',
    },
    {
      label: 'lcm',
      detail: 'lcm(a, b)',
      insertText: 'lcm(${1:a}, ${2:b})',
      doc: 'LCM (C++17)',
    },
    {
      label: 'abs',
      detail: 'abs(x)',
      insertText: 'abs(${1:x})',
      doc: 'Giá trị tuyệt đối',
    },
    {
      label: 'minmax',
      detail: 'min / max',
      insertText: '${1|min,max|}(${2:a}, ${3:b})',
      doc: 'Min hoặc Max',
    },
    {
      label: 'clamp',
      detail: 'clamp(val, lo, hi)',
      insertText: 'clamp(${1:val}, ${2:lo}, ${3:hi})',
      doc: 'Clamp giá trị trong [lo, hi]',
    },
    {
      label: 'pow',
      detail: 'pow(base, exp)',
      insertText: 'pow(${1:base}, ${2:exp})',
      doc: 'Lũy thừa (float)',
    },
    {
      label: 'sqrt',
      detail: 'sqrt(x)',
      insertText: 'sqrt(${1:x})',
      doc: 'Căn bậc hai',
    },
    {
      label: 'INF',
      detail: 'const int INF',
      insertText: 'const int INF = 1e9;',
      doc: 'Hằng vô cực (int)',
    },
    {
      label: 'LINF',
      detail: 'const long long INF',
      insertText: 'const long long INF = 1e18;',
      doc: 'Hằng vô cực (long long)',
    },
    {
      label: 'MOD',
      detail: 'const int MOD',
      insertText: 'const int MOD = 1e9 + 7;',
      doc: 'Modulo 10^9+7',
    },

    // Control flow
    {
      label: 'if',
      detail: 'if (...) { }',
      insertText: 'if (${1:condition}) {\n    ${2:// body}\n}',
      doc: 'If statement',
    },
    {
      label: 'ife',
      detail: 'if (...) { } else { }',
      insertText: 'if (${1:condition}) {\n    ${2:// body}\n} else {\n    ${3:// else}\n}',
      doc: 'If-else',
    },
    {
      label: 'sw',
      detail: 'switch (...) { }',
      insertText: 'switch (${1:val}) {\n    case ${2:0}:\n        ${3:// body}\n        break;\n    default:\n        break;\n}',
      doc: 'Switch statement',
    },

    // Functions
    {
      label: 'fn',
      detail: 'function template',
      insertText: '${1:int} ${2:func}(${3:int n}) {\n    ${4:// body}\n    return ${5:0};\n}',
      doc: 'Khai báo function',
    },
    {
      label: 'lambda',
      detail: 'auto f = [&](...) { }',
      insertText: 'auto ${1:f} = [&](${2:int x}) {\n    return ${3:x};\n};',
      doc: 'Lambda function',
    },
    {
      label: 'struct',
      detail: 'struct { };',
      insertText: 'struct ${1:Node} {\n    ${2:int val};\n    ${1:Node}(${2:int val}) : ${2:val}(val) {}\n};',
      doc: 'Struct với constructor',
    },

    // Competitive Programming patterns
    {
      label: 'dfs',
      detail: 'DFS template',
      insertText: [
        'void dfs(int u, int parent, vector<vector<int>>& adj) {',
        '    for (int v : adj[u]) {',
        '        if (v == parent) continue;',
        '        dfs(v, u, adj);',
        '    }',
        '}',
      ].join('\n'),
      doc: 'DFS trên cây/đồ thị',
    },
    {
      label: 'bfs',
      detail: 'BFS template',
      insertText: [
        'vector<int> dist(n, -1);',
        'queue<int> q;',
        'dist[${1:src}] = 0;',
        'q.push(${1:src});',
        'while (!q.empty()) {',
        '    int u = q.front(); q.pop();',
        '    for (int v : adj[u]) {',
        '        if (dist[v] == -1) {',
        '            dist[v] = dist[u] + 1;',
        '            q.push(v);',
        '        }',
        '    }',
        '}',
      ].join('\n'),
      doc: 'BFS tìm đường ngắn nhất',
    },
    {
      label: 'dp',
      detail: 'DP array init',
      insertText: 'vector<${1:long long}> dp(${2:n} + 1, ${3:0});',
      doc: 'Khởi tạo mảng DP',
    },
    {
      label: 'dp2d',
      detail: '2D DP',
      insertText: 'vector<vector<${1:long long}>> dp(${2:n} + 1, vector<${1:long long}>(${3:m} + 1, ${4:0}));',
      doc: 'Khởi tạo DP 2 chiều',
    },
  ];

  monaco.languages.registerCompletionItemProvider('cpp', {
    triggerCharacters: ['.', '>', '#', '<', '(', ' '],

    provideCompletionItems(model: any, position: any) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber:   position.lineNumber,
        startColumn:     word.startColumn,
        endColumn:       word.endColumn,
      };

      const suggestions = snippets.map((s) => ({
        label:            s.label,
        kind:             CompletionItemKind.Snippet,
        detail:           s.detail,
        documentation:    { value: s.doc },
        insertText:       s.insertText,
        insertTextRules:  CompletionItemInsertTextRule.InsertAsSnippet,
        range,
        sortText:         '0' + s.label, // Hiện lên đầu
      }));

      return { suggestions };
    },
  });
}
