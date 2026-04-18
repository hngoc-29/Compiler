/**
 * lib/cpp-suggestions.ts
 * Đăng ký C++ completion provider cho Monaco Editor.
 * Phiên bản: CHỈ gợi ý từ khóa, tuyệt đối không tự động điền code hay dấu ngoặc.
 */

// ── Fuzzy scoring ──────────────────────────────────────────────────────────
function fuzzyScore(query: string, target: string): number {
  if (!query) return 500;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (t === q)         return 2000;
  if (t.startsWith(q)) return 1800;
  if (t.includes(q))   return 1400;

  // Sub-sequence matching
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
  kind?:      'keyword' | 'function' | 'class';
}

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

// ── STL Types & Containers ────────────────────────────────────────────────
const STL_TYPES = [
  'vector', 'pair', 'map', 'unordered_map', 'set', 'unordered_set', 'multiset',
  'priority_queue', 'stack', 'queue', 'deque', 'array', 'bitset',
  'list', 'forward_list', 'tuple', 'complex', 'valarray'
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

// Gán insertText CHỈ bằng đúng giá trị của label (không thêm (), <>, hay snippet)
const cppKeywords: SuggestionDef[] = KEYWORDS.map(kw => ({
  label: kw, detail: 'C++ keyword', insertText: kw, doc: kw, kind: 'keyword' as const,
}));

const stlTypes: SuggestionDef[] = STL_TYPES.map(type => ({
  label: type, detail: `std::${type}`, insertText: type, doc: `std::${type}`, kind: 'class' as const,
}));

const stlFunctions: SuggestionDef[] = STL_FUNCS.map(fn => ({
  label: fn, detail: `std::${fn}`, insertText: fn, doc: `std::${fn}`, kind: 'function' as const,
}));

const allSuggestions: SuggestionDef[] = [
  ...cppKeywords,
  ...stlTypes,
  ...stlFunctions,
];

// ── Export ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCppSuggestions(monaco: any) {
  if ((window as any).__cppSuggestionsRegistered) return;
  (window as any).__cppSuggestionsRegistered = true;

  const { CompletionItemKind } = monaco.languages;
  const kindMap: Record<string, number> = {
    keyword:  CompletionItemKind.Keyword,
    function: CompletionItemKind.Function,
    class:    CompletionItemKind.Class,
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
        .filter(() => query.length > 0); // Chỉ hiện bảng gợi ý khi người dùng thực sự đang gõ chữ

      return {
        suggestions: scored.map(({ s, score }) => ({
          label:           s.label,
          kind:            kindMap[s.kind ?? 'keyword'],
          detail:          s.detail,
          documentation:   { value: s.doc },
          insertText:      s.insertText,
          insertTextRules: 0, // Cấu hình mức 0: Monaco editor chèn văn bản thuần túy, loại bỏ tính năng Snippet
          range,
          sortText:  String(100000 - score).padStart(6, '0') + s.label,
          preselect: score >= 1800,
        })),
      };
    },
  });
}