/**
 * lib/cpp-suggestions.ts
 * Đăng ký C++ completion provider cho Monaco Editor.
 * v2: Fuzzy matching + full C++ keyword/STL database.
 */

// ── Fuzzy scoring ──────────────────────────────────────────────────────────
function fuzzyScore(query: string, target: string): number {
  if (!query) return 500;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (t === q)         return 2000;
  if (t.startsWith(q)) return 1800;
  if (t.includes(q))   return 1400;

  // Sub-sequence matching (e.g. "fr" matches "forr")
  let qi = 0, bonus = 1000, consecutive = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { qi++; consecutive++; bonus += consecutive * 5; }
    else { consecutive = 0; }
  }
  if (qi < q.length) return -1;
  return bonus;
}

interface SuggestionDef {
  label:      string;
  detail:     string;
  insertText: string;
  doc:        string;
  kind?:      'snippet' | 'keyword' | 'function' | 'class' | 'variable';
}

// ── Snippets ───────────────────────────────────────────────────────────────
const snippets: SuggestionDef[] = [
  // Templates
  { label:'bits',    detail:'#include <bits/stdc++.h>',                                  insertText:'#include <bits/stdc++.h>\nusing namespace std;\n',                                                                 doc:'Include tất cả standard headers', kind:'snippet' },
  { label:'main',    detail:'int main() { ... }',                                        insertText:'#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    ${1:// code here}\n    return 0;\n}', doc:'Template main với fast I/O', kind:'snippet' },
  { label:'fastio',  detail:'ios_base::sync_with_stdio(false); cin.tie(NULL);',          insertText:'ios_base::sync_with_stdio(false);\ncin.tie(NULL);',                                                                doc:'Fast I/O',                        kind:'snippet' },

  // Loops
  { label:'fori',    detail:'for (int i = 0; i < n; i++)',                               insertText:'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// body}\n}',                                        doc:'For loop tăng dần',    kind:'snippet' },
  { label:'forr',    detail:'for (int i = n-1; i >= 0; i--)',                            insertText:'for (int ${1:i} = ${2:n} - 1; ${1:i} >= 0; ${1:i}--) {\n    ${3:// body}\n}',                                   doc:'For loop giảm dần',    kind:'snippet' },
  { label:'fore',    detail:'for (auto& e : container)',                                  insertText:'for (auto& ${1:e} : ${2:v}) {\n    ${3:// body}\n}',                                                              doc:'Range-based for loop', kind:'snippet' },
  { label:'forep',   detail:'for (auto [k,v] : map)',                                    insertText:'for (auto& [${1:k}, ${2:v}] : ${3:mp}) {\n    ${4:// body}\n}',                                                  doc:'For over map/pair',    kind:'snippet' },
  { label:'rep',     detail:'repeat n times',                                             insertText:'for (int ${1:i} = 0; ${1:i} < (int)(${2:n}); ++${1:i})',                                                        doc:'Repeat n lần',         kind:'snippet' },
  { label:'while',   detail:'while (condition)',                                          insertText:'while (${1:condition}) {\n    ${2:// body}\n}',                                                                   doc:'While loop',           kind:'snippet' },
  { label:'dowhile', detail:'do { } while ();',                                          insertText:'do {\n    ${1:// body}\n} while (${2:condition});',                                                               doc:'Do-while loop',        kind:'snippet' },

  // I/O
  { label:'cout',    detail:'cout << val << "\\n"',                                      insertText:'cout << ${1:val} << "\\n";',                                                                                       doc:'Output',               kind:'snippet' },
  { label:'cin',     detail:'cin >> var',                                                 insertText:'cin >> ${1:var};',                                                                                                 doc:'Input',                kind:'snippet' },
  { label:'cerr',    detail:'cerr << msg',                                                insertText:'cerr << ${1:msg} << "\\n";',                                                                                      doc:'Stderr output',        kind:'snippet' },
  { label:'printf',  detail:'printf("...", ...)',                                          insertText:'printf("${1:%d}\\n", ${2:val});',                                                                                 doc:'Formatted output',     kind:'snippet' },
  { label:'scanf',   detail:'scanf("...", &var)',                                          insertText:'scanf("${1:%d}", &${2:var});',                                                                                    doc:'Formatted input',      kind:'snippet' },
  { label:'fopen',   detail:'freopen for file I/O',                                      insertText:'freopen("${1:input}.txt", "r", stdin);\nfreopen("${2:output}.txt", "w", stdout);',                               doc:'File redirection',     kind:'snippet' },
  { label:'getline', detail:'getline(cin, str)',                                          insertText:'getline(cin, ${1:str});',                                                                                          doc:'Read full line',       kind:'snippet' },
  { label:'sstr',    detail:'stringstream',                                               insertText:'stringstream ${1:ss};\n${1:ss} << ${2:val};\nstring ${3:s} = ${1:ss}.str();',                                    doc:'String stream',        kind:'snippet' },

  // Data structures
  { label:'vi',      detail:'vector<int>',                                                insertText:'vector<int> ${1:v}(${2:n});',                                                                                     doc:'Vector<int>',          kind:'snippet' },
  { label:'vll',     detail:'vector<long long>',                                          insertText:'vector<long long> ${1:v}(${2:n});',                                                                               doc:'Vector<long long>',    kind:'snippet' },
  { label:'vvi',     detail:'vector<vector<int>>',                                        insertText:'vector<vector<int>> ${1:g}(${2:n}, vector<int>(${3:m}, ${4:0}));',                                               doc:'2D vector',            kind:'snippet' },
  { label:'vs',      detail:'vector<string>',                                             insertText:'vector<string> ${1:v}(${2:n});',                                                                                  doc:'Vector<string>',       kind:'snippet' },
  { label:'pii',     detail:'pair<int,int>',                                              insertText:'pair<int, int> ${1:p} = {${2:a}, ${3:b}};',                                                                      doc:'Pair<int,int>',        kind:'snippet' },
  { label:'pll',     detail:'pair<long long, long long>',                                 insertText:'pair<long long, long long> ${1:p};',                                                                              doc:'Pair<ll,ll>',          kind:'snippet' },
  { label:'mii',     detail:'map<int,int>',                                               insertText:'map<int, int> ${1:mp};',                                                                                          doc:'Map<int,int>',         kind:'snippet' },
  { label:'msi',     detail:'map<string,int>',                                            insertText:'map<string, int> ${1:mp};',                                                                                       doc:'Map<string,int>',      kind:'snippet' },
  { label:'umi',     detail:'unordered_map<int,int>',                                     insertText:'unordered_map<int, int> ${1:mp};',                                                                                doc:'Unordered map O(1)',   kind:'snippet' },
  { label:'ums',     detail:'unordered_map<string,int>',                                  insertText:'unordered_map<string, int> ${1:mp};',                                                                             doc:'Unordered map string', kind:'snippet' },
  { label:'si',      detail:'set<int>',                                                   insertText:'set<int> ${1:st};',                                                                                               doc:'Set<int>',             kind:'snippet' },
  { label:'mset',    detail:'multiset<int>',                                              insertText:'multiset<int> ${1:ms};',                                                                                          doc:'Multiset<int>',        kind:'snippet' },
  { label:'pq',      detail:'priority_queue (max-heap)',                                  insertText:'priority_queue<int> ${1:pq};',                                                                                    doc:'Max-heap',             kind:'snippet' },
  { label:'pqmin',   detail:'priority_queue (min-heap)',                                  insertText:'priority_queue<int, vector<int>, greater<int>> ${1:pq};',                                                        doc:'Min-heap',             kind:'snippet' },
  { label:'pqp',     detail:'priority_queue<pair<int,int>> (max)',                        insertText:'priority_queue<pair<int,int>> ${1:pq};',                                                                         doc:'Pair max-heap',        kind:'snippet' },
  { label:'stack',   detail:'stack<int>',                                                 insertText:'stack<int> ${1:st};',                                                                                             doc:'Stack<int>',           kind:'snippet' },
  { label:'queue',   detail:'queue<int>',                                                 insertText:'queue<int> ${1:q};',                                                                                              doc:'Queue<int>',           kind:'snippet' },
  { label:'deque',   detail:'deque<int>',                                                 insertText:'deque<int> ${1:dq};',                                                                                             doc:'Deque<int>',           kind:'snippet' },
  { label:'arr',     detail:'array<int, N>',                                              insertText:'array<int, ${1:N}> ${2:a};',                                                                                      doc:'Fixed array',          kind:'snippet' },
  { label:'bitset',  detail:'bitset<N>',                                                  insertText:'bitset<${1:N}> ${2:bs};',                                                                                         doc:'Bitset',               kind:'snippet' },

  // Algorithms
  { label:'sort',    detail:'sort(begin, end)',                                            insertText:'sort(${1:v}.begin(), ${1:v}.end());',                                                                             doc:'Sort tăng dần',        kind:'snippet' },
  { label:'sortr',   detail:'sort descending',                                             insertText:'sort(${1:v}.begin(), ${1:v}.end(), greater<${2:int}>());',                                                       doc:'Sort giảm dần',        kind:'snippet' },
  { label:'sortl',   detail:'sort with lambda',                                            insertText:'sort(${1:v}.begin(), ${1:v}.end(), [](const auto& a, const auto& b) {\n    return ${2:a < b};\n});',             doc:'Sort custom',          kind:'snippet' },
  { label:'lb',      detail:'lower_bound',                                                 insertText:'lower_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})',                                                            doc:'Lower bound',          kind:'snippet' },
  { label:'ub',      detail:'upper_bound',                                                 insertText:'upper_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})',                                                            doc:'Upper bound',          kind:'snippet' },
  { label:'bs',      detail:'binary_search',                                               insertText:'binary_search(${1:v}.begin(), ${1:v}.end(), ${2:val})',                                                         doc:'Binary search',        kind:'snippet' },
  { label:'rev',     detail:'reverse',                                                     insertText:'reverse(${1:v}.begin(), ${1:v}.end());',                                                                         doc:'Đảo ngược',            kind:'snippet' },
  { label:'uniq',    detail:'unique + erase',                                              insertText:'${1:v}.erase(unique(${1:v}.begin(), ${1:v}.end()), ${1:v}.end());',                                             doc:'Xóa trùng',            kind:'snippet' },
  { label:'accum',   detail:'accumulate',                                                  insertText:'accumulate(${1:v}.begin(), ${1:v}.end(), ${2:0LL})',                                                             doc:'Tính tổng',            kind:'snippet' },
  { label:'fill',    detail:'fill(begin, end, val)',                                       insertText:'fill(${1:v}.begin(), ${1:v}.end(), ${2:0});',                                                                    doc:'Điền giá trị',         kind:'snippet' },
  { label:'maxe',    detail:'*max_element',                                                insertText:'*max_element(${1:v}.begin(), ${1:v}.end())',                                                                     doc:'Phần tử lớn nhất',     kind:'snippet' },
  { label:'mine',    detail:'*min_element',                                                insertText:'*min_element(${1:v}.begin(), ${1:v}.end())',                                                                     doc:'Phần tử nhỏ nhất',     kind:'snippet' },
  { label:'count',   detail:'count(begin, end, val)',                                      insertText:'count(${1:v}.begin(), ${1:v}.end(), ${2:val})',                                                                  doc:'Đếm xuất hiện',        kind:'snippet' },
  { label:'find',    detail:'find(begin, end, val)',                                       insertText:'find(${1:v}.begin(), ${1:v}.end(), ${2:val})',                                                                   doc:'Tìm phần tử',          kind:'snippet' },
  { label:'nextp',   detail:'next_permutation',                                            insertText:'next_permutation(${1:v}.begin(), ${1:v}.end())',                                                                 doc:'Hoán vị tiếp theo',    kind:'snippet' },
  { label:'iota',    detail:'iota(begin, end, start)',                                     insertText:'iota(${1:v}.begin(), ${1:v}.end(), ${2:0});',                                                                   doc:'Điền 0,1,2,...',       kind:'snippet' },
  { label:'rotate',  detail:'rotate(begin, mid, end)',                                     insertText:'rotate(${1:v}.begin(), ${1:v}.begin() + ${2:k}, ${1:v}.end());',                                                doc:'Xoay mảng',            kind:'snippet' },

  // Math & Constants
  { label:'gcd',     detail:'__gcd(a, b)',                                                 insertText:'__gcd(${1:a}, ${2:b})',                                                                                          doc:'GCD',                  kind:'snippet' },
  { label:'lcm',     detail:'lcm(a, b)',                                                   insertText:'lcm(${1:a}, ${2:b})',                                                                                             doc:'LCM (C++17)',          kind:'snippet' },
  { label:'abs',     detail:'abs(x)',                                                      insertText:'abs(${1:x})',                                                                                                     doc:'Giá trị tuyệt đối',    kind:'snippet' },
  { label:'minmax',  detail:'min / max',                                                   insertText:'${1|min,max|}(${2:a}, ${3:b})',                                                                                  doc:'Min / Max',            kind:'snippet' },
  { label:'clamp',   detail:'clamp(val, lo, hi)',                                          insertText:'clamp(${1:val}, ${2:lo}, ${3:hi})',                                                                              doc:'Clamp trong [lo,hi]',  kind:'snippet' },
  { label:'pow',     detail:'pow(base, exp)',                                               insertText:'pow(${1:base}, ${2:exp})',                                                                                       doc:'Lũy thừa (float)',     kind:'snippet' },
  { label:'sqrt',    detail:'sqrt(x)',                                                     insertText:'sqrt(${1:x})',                                                                                                    doc:'Căn bậc hai',          kind:'snippet' },
  { label:'INF',     detail:'const int INF = 1e9',                                         insertText:'const int INF = 1e9;',                                                                                           doc:'Hằng vô cực (int)',    kind:'snippet' },
  { label:'LINF',    detail:'const long long INF = 1e18',                                  insertText:'const long long INF = 1e18;',                                                                                    doc:'Hằng vô cực (ll)',     kind:'snippet' },
  { label:'MOD',     detail:'const int MOD = 1e9+7',                                       insertText:'const int MOD = 1e9 + 7;',                                                                                       doc:'Modulo 10^9+7',        kind:'snippet' },
  { label:'eps',     detail:'const double EPS = 1e-9',                                     insertText:'const double EPS = 1e-9;',                                                                                       doc:'Epsilon float',        kind:'snippet' },
  { label:'PI',      detail:'const double PI = acos(-1)',                                  insertText:'const double PI = acos(-1.0);',                                                                                  doc:'Hằng Pi',              kind:'snippet' },

  // Control flow
  { label:'if',      detail:'if (...) { }',                                                insertText:'if (${1:condition}) {\n    ${2:// body}\n}',                                                                     doc:'If statement',         kind:'snippet' },
  { label:'ife',     detail:'if-else',                                                     insertText:'if (${1:condition}) {\n    ${2:// body}\n} else {\n    ${3:// else}\n}',                                        doc:'If-else',              kind:'snippet' },
  { label:'elif',    detail:'else if',                                                     insertText:'else if (${1:condition}) {\n    ${2:// body}\n}',                                                               doc:'Else if',              kind:'snippet' },
  { label:'sw',      detail:'switch (...) { }',                                            insertText:'switch (${1:val}) {\n    case ${2:0}:\n        ${3:// body}\n        break;\n    default:\n        break;\n}',  doc:'Switch statement',     kind:'snippet' },
  { label:'tern',    detail:'cond ? a : b',                                                insertText:'${1:cond} ? ${2:a} : ${3:b}',                                                                                    doc:'Ternary operator',     kind:'snippet' },

  // Functions & Classes
  { label:'fn',      detail:'function template',                                           insertText:'${1:int} ${2:func}(${3:int n}) {\n    ${4:// body}\n    return ${5:0};\n}',                                     doc:'Khai báo function',    kind:'snippet' },
  { label:'lambda',  detail:'auto f = [&](...) { }',                                      insertText:'auto ${1:f} = [&](${2:int x}) {\n    return ${3:x};\n};',                                                       doc:'Lambda function',      kind:'snippet' },
  { label:'struct',  detail:'struct Node { };',                                            insertText:'struct ${1:Node} {\n    ${2:int val};\n    ${1:Node}(${2:int val}) : ${2:val}(val) {}\n};',                     doc:'Struct',               kind:'snippet' },
  { label:'class',   detail:'class MyClass { };',                                          insertText:'class ${1:MyClass} {\npublic:\n    ${2:// members}\n};',                                                        doc:'Class',                kind:'snippet' },
  { label:'typedef', detail:'using T = ...',                                               insertText:'using ${1:ll} = ${2:long long};',                                                                               doc:'Type alias',           kind:'snippet' },
  { label:'opoveq',  detail:'operator overload ==',                                        insertText:'bool operator==(const ${1:T}& o) const {\n    return ${2:val == o.val};\n}',                                    doc:'Operator overload',    kind:'snippet' },
  { label:'opovlt',  detail:'operator overload <',                                         insertText:'bool operator<(const ${1:T}& o) const {\n    return ${2:val < o.val};\n}',                                     doc:'Operator < overload',  kind:'snippet' },

  // CP Patterns
  {
    label:'dfs', detail:'DFS template', kind:'snippet', doc:'DFS trên cây/đồ thị',
    insertText:'void dfs(int u, int parent, vector<vector<int>>& adj) {\n    for (int v : adj[u]) {\n        if (v == parent) continue;\n        dfs(v, u, adj);\n    }\n}',
  },
  {
    label:'bfs', detail:'BFS template', kind:'snippet', doc:'BFS tìm đường ngắn nhất',
    insertText:'vector<int> dist(n, -1);\nqueue<int> q;\ndist[${1:src}] = 0;\nq.push(${1:src});\nwhile (!q.empty()) {\n    int u = q.front(); q.pop();\n    for (int v : adj[u]) {\n        if (dist[v] == -1) {\n            dist[v] = dist[u] + 1;\n            q.push(v);\n        }\n    }\n}',
  },
  {
    label:'dijkstra', detail:'Dijkstra template', kind:'snippet', doc:"Dijkstra's shortest path",
    insertText:'vector<long long> dist(n, LLONG_MAX);\npriority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;\ndist[${1:src}] = 0;\npq.push({0, ${1:src}});\nwhile (!pq.empty()) {\n    auto [d, u] = pq.top(); pq.pop();\n    if (d > dist[u]) continue;\n    for (auto [v, w] : adj[u]) {\n        if (dist[u] + w < dist[v]) {\n            dist[v] = dist[u] + w;\n            pq.push({dist[v], v});\n        }\n    }\n}',
  },
  { label:'dp',      detail:'DP array',  kind:'snippet', doc:'Mảng DP 1D',  insertText:'vector<${1:long long}> dp(${2:n} + 1, ${3:0});' },
  { label:'dp2d',    detail:'2D DP',     kind:'snippet', doc:'Mảng DP 2D',  insertText:'vector<vector<${1:long long}>> dp(${2:n} + 1, vector<${1:long long}>(${3:m} + 1, ${4:0}));' },
  {
    label:'segtree', detail:'Segment Tree', kind:'snippet', doc:'Segment tree range-sum',
    insertText:'struct SegTree {\n    int n; vector<long long> t;\n    SegTree(int n) : n(n), t(4*n, 0) {}\n    void upd(int v, int l, int r, int i, long long x) {\n        if (l==r) { t[v]+=x; return; }\n        int m=(l+r)/2;\n        if (i<=m) upd(2*v,l,m,i,x); else upd(2*v+1,m+1,r,i,x);\n        t[v]=t[2*v]+t[2*v+1];\n    }\n    long long qry(int v, int l, int r, int ql, int qr) {\n        if (qr<l||r<ql) return 0;\n        if (ql<=l&&r<=qr) return t[v];\n        int m=(l+r)/2;\n        return qry(2*v,l,m,ql,qr)+qry(2*v+1,m+1,r,ql,qr);\n    }\n};',
  },
  {
    label:'dsu', detail:'Disjoint Set Union', kind:'snippet', doc:'Union-Find path compression + rank',
    insertText:'struct DSU {\n    vector<int> p, r;\n    DSU(int n): p(n), r(n,0) { iota(p.begin(),p.end(),0); }\n    int find(int x) { return p[x]==x?x:p[x]=find(p[x]); }\n    bool unite(int x, int y) {\n        x=find(x); y=find(y);\n        if(x==y) return false;\n        if(r[x]<r[y]) swap(x,y);\n        p[y]=x; if(r[x]==r[y]) r[x]++;\n        return true;\n    }\n};',
  },
  {
    label:'fenwick', detail:'Fenwick Tree (BIT)', kind:'snippet', doc:'Binary Indexed Tree prefix sum',
    insertText:'struct Fenwick {\n    int n; vector<long long> bit;\n    Fenwick(int n): n(n), bit(n+1,0) {}\n    void upd(int i, long long v) { for(;i<=n;i+=i&-i) bit[i]+=v; }\n    long long qry(int i) { long long s=0; for(;i>0;i-=i&-i) s+=bit[i]; return s; }\n    long long qry(int l, int r) { return qry(r)-qry(l-1); }\n};',
  },
];

// ── C++ keywords ──────────────────────────────────────────────────────────
const KEYWORDS = [
  'int','long','short','char','bool','float','double','void',
  'unsigned','signed','auto','decltype','nullptr','true','false',
  'string','size_t','int8_t','int16_t','int32_t','int64_t',
  'uint8_t','uint16_t','uint32_t','uint64_t',
  'const','constexpr','static','inline','extern','volatile','mutable',
  'explicit','virtual','override','final','noexcept','typename',
  'template','namespace','using','typedef','public','private','protected',
  'friend','operator','new','delete','this','sizeof','alignof','typeid',
  'throw','try','catch','return','break','continue','goto',
  'case','default','enum','struct','class','union',
  'if','else','for','while','do','switch',
];

// ── STL functions & methods ───────────────────────────────────────────────
const STL_FUNCS = [
  // algorithm
  'sort','stable_sort','partial_sort','nth_element',
  'lower_bound','upper_bound','binary_search','equal_range',
  'reverse','rotate','shuffle',
  'find','find_if','find_if_not','count','count_if',
  'all_of','any_of','none_of','for_each',
  'min','max','minmax','min_element','max_element',
  'clamp','abs','gcd','lcm',
  'accumulate','partial_sum','adjacent_difference','iota','reduce',
  'fill','fill_n','generate','generate_n',
  'copy','copy_if','copy_n','move','swap','iter_swap',
  'transform','replace','replace_if','remove','remove_if',
  'unique','merge','inplace_merge',
  'set_union','set_intersection','set_difference',
  'next_permutation','prev_permutation',
  'make_heap','push_heap','pop_heap','sort_heap','is_heap',
  'is_sorted','is_sorted_until','is_permutation',
  // string
  'stoi','stol','stoll','stoul','stoull','stof','stod','to_string',
  // utility
  'make_pair','make_tuple','get','tie','forward','exchange',
  // cmath
  'sqrt','cbrt','pow','exp','log','log2','log10',
  'sin','cos','tan','asin','acos','atan','atan2',
  'ceil','floor','round','trunc','fmod','hypot',
];

const cppKeywords: SuggestionDef[] = KEYWORDS.map(kw => ({
  label: kw, detail: 'C++ keyword', insertText: kw, doc: kw, kind: 'keyword' as const,
}));

const stlFunctions: SuggestionDef[] = STL_FUNCS.map(fn => ({
  label: fn, detail: `std::${fn}`, insertText: `${fn}(`, doc: `std::${fn}`, kind: 'function' as const,
}));

const allSuggestions: SuggestionDef[] = [
  ...snippets,
  ...cppKeywords,
  ...stlFunctions,
];

// ── Export ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCppSuggestions(monaco: any) {
  if ((window as any).__cppSuggestionsRegistered) return;
  (window as any).__cppSuggestionsRegistered = true;

  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;
  const kindMap: Record<string, number> = {
    snippet:  CompletionItemKind.Snippet,
    keyword:  CompletionItemKind.Keyword,
    function: CompletionItemKind.Function,
    class:    CompletionItemKind.Class,
    variable: CompletionItemKind.Variable,
  };

  monaco.languages.registerCompletionItemProvider('cpp', {
    triggerCharacters: ['.', '>', '#', '<', '(', '_'],

    provideCompletionItems(model: any, position: any) {
      const word  = model.getWordUntilPosition(position);
      const query = word.word;
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber:   position.lineNumber,
        startColumn:     word.startColumn,
        endColumn:       word.endColumn,
      };

      const scored = allSuggestions
        .map(s => ({ s, score: fuzzyScore(query, s.label) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => b.score - a.score)
        // Khi không gõ gì, chỉ show snippets để tránh flooding
        .filter(({ s, score }) => query.length > 0 || s.kind === 'snippet');

      return {
        suggestions: scored.map(({ s, score }) => ({
          label:           s.label,
          kind:            kindMap[s.kind ?? 'snippet'],
          detail:          s.detail,
          documentation:   { value: s.doc },
          insertText:      s.insertText,
          insertTextRules: s.kind === 'keyword' || s.kind === 'function'
            ? 0
            : CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          sortText:  String(100000 - score).padStart(6, '0') + s.label,
          preselect: score >= 1800,
        })),
      };
    },
  });
}
