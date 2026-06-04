/**
 * lib/cpp-suggestions.ts  v3
 * - Rich completions with parameter signatures (like VSCode IntelliSense)
 * - Signature Help provider (shows param hints when typing after `(`)
 * - Full STL + C standard library coverage
 * - Python & C basic suggestions
 * - Controlled by EditorSettings
 */

// ── Fuzzy scoring ──────────────────────────────────────────────────────────
function fuzzyScore(query: string, target: string): number {
  if (!query) return 500;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q)         return 2000;
  if (t.startsWith(q)) return 1800;
  if (t.includes(q))   return 1400;
  let qi = 0, bonus = 1000, consecutive = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { qi++; consecutive++; bonus += consecutive * 5; }
    else { consecutive = 0; }
  }
  if (qi < q.length) return -1;
  return bonus;
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface Param { name: string; type: string; description: string; }

export interface SuggestionDef {
  label:       string;
  detail:      string;
  insertText:  string;
  doc:         string;
  kind?:       'keyword' | 'function' | 'class' | 'field' | 'method' | 'snippet' | 'variable';
  params?:     Param[];          // for function signature help
  returnType?: string;
  overloads?:  { params: Param[]; returnType: string; doc?: string }[];
}

// ── Keywords ──────────────────────────────────────────────────────────────
const KEYWORDS: SuggestionDef[] = [
  // types
  { label:'int',       detail:'built-in type',  insertText:'int',       doc:'32-bit signed integer', kind:'keyword' },
  { label:'long',      detail:'built-in type',  insertText:'long',      doc:'64-bit signed integer (platform-dependent)', kind:'keyword' },
  { label:'short',     detail:'built-in type',  insertText:'short',     doc:'16-bit signed integer', kind:'keyword' },
  { label:'char',      detail:'built-in type',  insertText:'char',      doc:'8-bit character type', kind:'keyword' },
  { label:'bool',      detail:'built-in type',  insertText:'bool',      doc:'Boolean type: true or false', kind:'keyword' },
  { label:'float',     detail:'built-in type',  insertText:'float',     doc:'32-bit floating point number', kind:'keyword' },
  { label:'double',    detail:'built-in type',  insertText:'double',    doc:'64-bit floating point number', kind:'keyword' },
  { label:'void',      detail:'built-in type',  insertText:'void',      doc:'No type / return nothing', kind:'keyword' },
  { label:'unsigned',  detail:'type modifier',  insertText:'unsigned',  doc:'Unsigned variant of integer types', kind:'keyword' },
  { label:'signed',    detail:'type modifier',  insertText:'signed',    doc:'Signed variant (default for most types)', kind:'keyword' },
  { label:'auto',      detail:'C++11 type deduction', insertText:'auto', doc:'Automatically deduce type from initializer', kind:'keyword' },
  { label:'decltype',  detail:'C++11',          insertText:'decltype',  doc:'decltype(expr) — yields the type of an expression', kind:'keyword' },
  { label:'nullptr',   detail:'null pointer',   insertText:'nullptr',   doc:'Null pointer literal (preferred over NULL)', kind:'keyword' },
  { label:'true',      detail:'bool literal',   insertText:'true',      doc:'Boolean true', kind:'keyword' },
  { label:'false',     detail:'bool literal',   insertText:'false',     doc:'Boolean false', kind:'keyword' },
  { label:'string',    detail:'std::string',    insertText:'string',    doc:'std::string — dynamic character sequence', kind:'keyword' },
  { label:'size_t',    detail:'unsigned type',  insertText:'size_t',    doc:'Unsigned type for sizes and counts', kind:'keyword' },
  // storage / qualifiers
  { label:'const',     detail:'qualifier',      insertText:'const',     doc:'Value cannot be changed after initialization', kind:'keyword' },
  { label:'constexpr', detail:'C++11',          insertText:'constexpr', doc:'Evaluated at compile-time', kind:'keyword' },
  { label:'static',    detail:'storage class',  insertText:'static',    doc:'Static storage duration / internal linkage', kind:'keyword' },
  { label:'inline',    detail:'linkage',        insertText:'inline',    doc:'Inline function or variable', kind:'keyword' },
  { label:'extern',    detail:'linkage',        insertText:'extern',    doc:'External linkage — defined elsewhere', kind:'keyword' },
  { label:'volatile',  detail:'qualifier',      insertText:'volatile',  doc:'Do not optimize away — value may change externally', kind:'keyword' },
  { label:'mutable',   detail:'class qualifier',insertText:'mutable',   doc:'Allow modification even in const context', kind:'keyword' },
  // OOP
  { label:'class',     detail:'OOP',            insertText:'class',     doc:'Define a class (members private by default)', kind:'keyword' },
  { label:'struct',    detail:'OOP',            insertText:'struct',    doc:'Define a struct (members public by default)', kind:'keyword' },
  { label:'public',    detail:'access',         insertText:'public',    doc:'Public access specifier', kind:'keyword' },
  { label:'private',   detail:'access',         insertText:'private',   doc:'Private access specifier', kind:'keyword' },
  { label:'protected', detail:'access',         insertText:'protected', doc:'Protected access specifier', kind:'keyword' },
  { label:'virtual',   detail:'OOP',            insertText:'virtual',   doc:'Virtual function — enables polymorphism', kind:'keyword' },
  { label:'override',  detail:'C++11',          insertText:'override',  doc:'Explicitly override a virtual function', kind:'keyword' },
  { label:'final',     detail:'C++11',          insertText:'final',     doc:'Prevent further overriding or inheritance', kind:'keyword' },
  { label:'explicit',  detail:'constructor',    insertText:'explicit',  doc:'Prevent implicit conversions in constructors', kind:'keyword' },
  { label:'friend',    detail:'OOP',            insertText:'friend',    doc:'Grant access to private/protected members', kind:'keyword' },
  { label:'this',      detail:'pointer',        insertText:'this',      doc:'Pointer to current object instance', kind:'keyword' },
  { label:'operator',  detail:'OOP',            insertText:'operator',  doc:'Operator overloading', kind:'keyword' },
  // templates
  { label:'template',  detail:'generic',        insertText:'template',  doc:'Template definition — generic programming', kind:'keyword' },
  { label:'typename',  detail:'template',       insertText:'typename',  doc:'Introduce a type parameter in templates', kind:'keyword' },
  // control flow
  { label:'if',        detail:'control flow',   insertText:'if',        doc:'Conditional execution', kind:'keyword' },
  { label:'else',      detail:'control flow',   insertText:'else',      doc:'Alternate branch of if', kind:'keyword' },
  { label:'for',       detail:'loop',           insertText:'for',       doc:'For loop', kind:'keyword' },
  { label:'while',     detail:'loop',           insertText:'while',     doc:'While loop', kind:'keyword' },
  { label:'do',        detail:'loop',           insertText:'do',        doc:'Do-while loop', kind:'keyword' },
  { label:'switch',    detail:'control flow',   insertText:'switch',    doc:'Switch on an integer/enum value', kind:'keyword' },
  { label:'case',      detail:'switch label',   insertText:'case',      doc:'Label in a switch statement', kind:'keyword' },
  { label:'default',   detail:'switch label',   insertText:'default',   doc:'Default case in switch', kind:'keyword' },
  { label:'break',     detail:'control flow',   insertText:'break',     doc:'Exit a loop or switch', kind:'keyword' },
  { label:'continue',  detail:'control flow',   insertText:'continue',  doc:'Skip to next loop iteration', kind:'keyword' },
  { label:'return',    detail:'control flow',   insertText:'return',    doc:'Return a value from a function', kind:'keyword' },
  { label:'goto',      detail:'jump',           insertText:'goto',      doc:'Unconditional jump (use sparingly)', kind:'keyword' },
  // exceptions
  { label:'throw',     detail:'exception',      insertText:'throw',     doc:'Throw an exception', kind:'keyword' },
  { label:'try',       detail:'exception',      insertText:'try',       doc:'Try block for exception handling', kind:'keyword' },
  { label:'catch',     detail:'exception',      insertText:'catch',     doc:'Catch block for handling exceptions', kind:'keyword' },
  { label:'noexcept',  detail:'C++11',          insertText:'noexcept',  doc:'Guarantee function does not throw', kind:'keyword' },
  // other
  { label:'new',       detail:'memory',         insertText:'new',       doc:'Allocate memory on the heap', kind:'keyword' },
  { label:'delete',    detail:'memory',         insertText:'delete',    doc:'Free heap-allocated memory', kind:'keyword' },
  { label:'sizeof',    detail:'operator',       insertText:'sizeof',    doc:'Size of a type or expression in bytes', kind:'keyword' },
  { label:'namespace', detail:'scope',          insertText:'namespace', doc:'Define a namespace scope', kind:'keyword' },
  { label:'using',     detail:'alias',          insertText:'using',     doc:'Type alias or namespace directive', kind:'keyword' },
  { label:'typedef',   detail:'alias',          insertText:'typedef',   doc:'Create a type alias (prefer using in C++11+)', kind:'keyword' },
  { label:'enum',      detail:'enumeration',    insertText:'enum',      doc:'Enumeration type', kind:'keyword' },
  { label:'union',     detail:'type',           insertText:'union',     doc:'Union — all members share same memory', kind:'keyword' },
];

// ── STL Container Types ────────────────────────────────────────────────────
const STL_TYPES: SuggestionDef[] = [
  { label:'vector',        detail:'std::vector<T>',        insertText:'vector',        doc:'Dynamic array. #include <vector>', kind:'class' },
  { label:'string',        detail:'std::string',           insertText:'string',        doc:'Dynamic character string. #include <string>', kind:'class' },
  { label:'pair',          detail:'std::pair<T1,T2>',      insertText:'pair',          doc:'Pair of two values. #include <utility>', kind:'class' },
  { label:'tuple',         detail:'std::tuple<...>',       insertText:'tuple',         doc:'Fixed-size collection of heterogeneous values. #include <tuple>', kind:'class' },
  { label:'map',           detail:'std::map<K,V>',         insertText:'map',           doc:'Ordered key-value store (BST). #include <map>', kind:'class' },
  { label:'unordered_map', detail:'std::unordered_map<K,V>',insertText:'unordered_map',doc:'Hash map O(1) average. #include <unordered_map>', kind:'class' },
  { label:'set',           detail:'std::set<T>',           insertText:'set',           doc:'Ordered unique values (BST). #include <set>', kind:'class' },
  { label:'unordered_set', detail:'std::unordered_set<T>', insertText:'unordered_set', doc:'Hash set O(1) average. #include <unordered_set>', kind:'class' },
  { label:'multiset',      detail:'std::multiset<T>',      insertText:'multiset',      doc:'Ordered set allowing duplicates. #include <set>', kind:'class' },
  { label:'multimap',      detail:'std::multimap<K,V>',    insertText:'multimap',      doc:'Ordered map allowing duplicate keys. #include <map>', kind:'class' },
  { label:'priority_queue',detail:'std::priority_queue<T>',insertText:'priority_queue',doc:'Max-heap by default. #include <queue>', kind:'class' },
  { label:'stack',         detail:'std::stack<T>',         insertText:'stack',         doc:'LIFO container adapter. #include <stack>', kind:'class' },
  { label:'queue',         detail:'std::queue<T>',         insertText:'queue',         doc:'FIFO container adapter. #include <queue>', kind:'class' },
  { label:'deque',         detail:'std::deque<T>',         insertText:'deque',         doc:'Double-ended queue. #include <deque>', kind:'class' },
  { label:'array',         detail:'std::array<T,N>',       insertText:'array',         doc:'Fixed-size array with STL interface. #include <array>', kind:'class' },
  { label:'list',          detail:'std::list<T>',          insertText:'list',          doc:'Doubly-linked list. #include <list>', kind:'class' },
  { label:'forward_list',  detail:'std::forward_list<T>',  insertText:'forward_list',  doc:'Singly-linked list. #include <forward_list>', kind:'class' },
  { label:'bitset',        detail:'std::bitset<N>',        insertText:'bitset',        doc:'Fixed-size bit array. #include <bitset>', kind:'class' },
  { label:'optional',      detail:'std::optional<T>',      insertText:'optional',      doc:'Value-or-nothing wrapper. #include <optional>', kind:'class' },
  { label:'variant',       detail:'std::variant<...>',     insertText:'variant',       doc:'Type-safe union. #include <variant>', kind:'class' },
  { label:'any',           detail:'std::any',              insertText:'any',           doc:'Type-erased value. #include <any>', kind:'class' },
  { label:'string_view',   detail:'std::string_view',      insertText:'string_view',   doc:'Non-owning string reference. #include <string_view>', kind:'class' },
  { label:'span',          detail:'std::span<T>',          insertText:'span',          doc:'Non-owning view of contiguous sequence (C++20). #include <span>', kind:'class' },
  { label:'shared_ptr',    detail:'std::shared_ptr<T>',    insertText:'shared_ptr',    doc:'Shared ownership smart pointer. #include <memory>', kind:'class' },
  { label:'unique_ptr',    detail:'std::unique_ptr<T>',    insertText:'unique_ptr',    doc:'Exclusive ownership smart pointer. #include <memory>', kind:'class' },
  { label:'weak_ptr',      detail:'std::weak_ptr<T>',      insertText:'weak_ptr',      doc:'Non-owning observer of shared_ptr. #include <memory>', kind:'class' },
];

// ── STL Functions with full signature info ─────────────────────────────────
const STL_FUNCS: SuggestionDef[] = [
  // Sorting
  {
    label:'sort', detail:'std::sort(first, last, comp?)', insertText:'sort', kind:'function',
    returnType:'void',
    params:[
      {name:'first', type:'RandomIt', description:'Iterator to beginning of range'},
      {name:'last',  type:'RandomIt', description:'Iterator to end of range (exclusive)'},
      {name:'comp',  type:'Compare',  description:'Optional comparator (default: operator<)'},
    ],
    doc:'Sort elements in ascending order (introsort). Average O(n log n).\n\n**Example:**\n```cpp\nvector<int> v = {3,1,4,1,5};\nsort(v.begin(), v.end());\n// descending:\nsort(v.begin(), v.end(), greater<int>());\n```\n#include <algorithm>',
  },
  {
    label:'stable_sort', detail:'std::stable_sort(first, last, comp?)', insertText:'stable_sort', kind:'function',
    returnType:'void',
    params:[
      {name:'first', type:'RandomIt', description:'Iterator to beginning'},
      {name:'last',  type:'RandomIt', description:'Iterator to end (exclusive)'},
      {name:'comp',  type:'Compare',  description:'Optional comparator'},
    ],
    doc:'Sort preserving relative order of equal elements. O(n log² n). #include <algorithm>',
  },
  {
    label:'partial_sort', detail:'std::partial_sort(first, middle, last)', insertText:'partial_sort', kind:'function',
    returnType:'void',
    params:[
      {name:'first',  type:'RandomIt', description:'Start of range'},
      {name:'middle', type:'RandomIt', description:'End of sorted portion'},
      {name:'last',   type:'RandomIt', description:'End of range'},
    ],
    doc:'Sorts [first, middle) — remaining elements are in unspecified order. O(n log m). #include <algorithm>',
  },
  {
    label:'nth_element', detail:'std::nth_element(first, nth, last)', insertText:'nth_element', kind:'function',
    returnType:'void',
    params:[
      {name:'first', type:'RandomIt', description:'Start of range'},
      {name:'nth',   type:'RandomIt', description:'Target position'},
      {name:'last',  type:'RandomIt', description:'End of range'},
    ],
    doc:'Rearranges so nth element is what it would be if sorted. Elements before < nth ≤ elements after. O(n). #include <algorithm>',
  },

  // Binary search
  {
    label:'lower_bound', detail:'std::lower_bound(first, last, value)', insertText:'lower_bound', kind:'function',
    returnType:'Iterator',
    params:[
      {name:'first', type:'ForwardIt',  description:'Start of sorted range'},
      {name:'last',  type:'ForwardIt',  description:'End of range'},
      {name:'value', type:'const T&',   description:'Value to search for'},
    ],
    doc:'Returns iterator to **first element ≥ value** in a sorted range. O(log n).\n\n**Example:**\n```cpp\nauto it = lower_bound(v.begin(), v.end(), 5);\nint idx = it - v.begin();\n```\n#include <algorithm>',
  },
  {
    label:'upper_bound', detail:'std::upper_bound(first, last, value)', insertText:'upper_bound', kind:'function',
    returnType:'Iterator',
    params:[
      {name:'first', type:'ForwardIt', description:'Start of sorted range'},
      {name:'last',  type:'ForwardIt', description:'End of range'},
      {name:'value', type:'const T&',  description:'Value to search for'},
    ],
    doc:'Returns iterator to **first element > value** in a sorted range. O(log n). #include <algorithm>',
  },
  {
    label:'binary_search', detail:'std::binary_search(first, last, value)', insertText:'binary_search', kind:'function',
    returnType:'bool',
    params:[
      {name:'first', type:'ForwardIt', description:'Start of sorted range'},
      {name:'last',  type:'ForwardIt', description:'End of range'},
      {name:'value', type:'const T&',  description:'Value to find'},
    ],
    doc:'Returns true if value is found in sorted range. O(log n). #include <algorithm>',
  },
  {
    label:'equal_range', detail:'std::equal_range(first, last, value)', insertText:'equal_range', kind:'function',
    returnType:'pair<Iterator,Iterator>',
    params:[
      {name:'first', type:'ForwardIt', description:'Start of sorted range'},
      {name:'last',  type:'ForwardIt', description:'End of range'},
      {name:'value', type:'const T&',  description:'Value to find'},
    ],
    doc:'Returns [lower_bound, upper_bound) — the subrange of all elements equal to value. O(log n). #include <algorithm>',
  },

  // Sequence operations
  {
    label:'reverse', detail:'std::reverse(first, last)', insertText:'reverse', kind:'function',
    returnType:'void',
    params:[
      {name:'first', type:'BidirIt', description:'Start of range'},
      {name:'last',  type:'BidirIt', description:'End of range'},
    ],
    doc:'Reverses elements in [first, last) in-place. O(n). #include <algorithm>',
  },
  {
    label:'rotate', detail:'std::rotate(first, n_first, last)', insertText:'rotate', kind:'function',
    returnType:'Iterator',
    params:[
      {name:'first',   type:'ForwardIt', description:'Start of range'},
      {name:'n_first', type:'ForwardIt', description:'Element that will be moved to front'},
      {name:'last',    type:'ForwardIt', description:'End of range'},
    ],
    doc:'Rotates range so n_first becomes the new first element. Returns iterator to old first element. O(n). #include <algorithm>',
  },
  {
    label:'shuffle', detail:'std::shuffle(first, last, g)', insertText:'shuffle', kind:'function',
    returnType:'void',
    params:[
      {name:'first', type:'RandomIt', description:'Start of range'},
      {name:'last',  type:'RandomIt', description:'End of range'},
      {name:'g',     type:'URBG&&',   description:'Random number generator (e.g. mt19937)'},
    ],
    doc:'Randomly shuffles elements using uniform distribution.\n\n**Example:**\n```cpp\nmt19937 rng(chrono::steady_clock::now().time_since_epoch().count());\nshuffle(v.begin(), v.end(), rng);\n```\n#include <algorithm>',
  },

  // Search
  {
    label:'find', detail:'std::find(first, last, value)', insertText:'find', kind:'function',
    returnType:'Iterator',
    params:[
      {name:'first', type:'InputIt', description:'Start of range'},
      {name:'last',  type:'InputIt', description:'End of range'},
      {name:'value', type:'const T&', description:'Value to find'},
    ],
    doc:'Returns iterator to first element equal to value, or last if not found. O(n). #include <algorithm>',
  },
  {
    label:'find_if', detail:'std::find_if(first, last, pred)', insertText:'find_if', kind:'function',
    returnType:'Iterator',
    params:[
      {name:'first', type:'InputIt',   description:'Start of range'},
      {name:'last',  type:'InputIt',   description:'End of range'},
      {name:'pred',  type:'UnaryPred', description:'Predicate function returning bool'},
    ],
    doc:'Returns iterator to first element satisfying pred. O(n).\n\n**Example:**\n```cpp\nauto it = find_if(v.begin(), v.end(), [](int x){ return x > 5; });\n```\n#include <algorithm>',
  },
  {
    label:'count', detail:'std::count(first, last, value)', insertText:'count', kind:'function',
    returnType:'ptrdiff_t',
    params:[
      {name:'first', type:'InputIt', description:'Start of range'},
      {name:'last',  type:'InputIt', description:'End of range'},
      {name:'value', type:'const T&', description:'Value to count'},
    ],
    doc:'Counts elements equal to value. O(n). #include <algorithm>',
  },
  {
    label:'count_if', detail:'std::count_if(first, last, pred)', insertText:'count_if', kind:'function',
    returnType:'ptrdiff_t',
    params:[
      {name:'first', type:'InputIt',   description:'Start of range'},
      {name:'last',  type:'InputIt',   description:'End of range'},
      {name:'pred',  type:'UnaryPred', description:'Predicate to count matches'},
    ],
    doc:'Counts elements satisfying pred. O(n). #include <algorithm>',
  },
  {
    label:'all_of', detail:'std::all_of(first, last, pred)', insertText:'all_of', kind:'function',
    returnType:'bool',
    params:[
      {name:'first', type:'InputIt',   description:'Start of range'},
      {name:'last',  type:'InputIt',   description:'End of range'},
      {name:'pred',  type:'UnaryPred', description:'Predicate to test'},
    ],
    doc:'Returns true if pred returns true for ALL elements. Returns true for empty range. O(n). #include <algorithm>',
  },
  {
    label:'any_of', detail:'std::any_of(first, last, pred)', insertText:'any_of', kind:'function',
    returnType:'bool',
    params:[
      {name:'first', type:'InputIt',   description:'Start of range'},
      {name:'last',  type:'InputIt',   description:'End of range'},
      {name:'pred',  type:'UnaryPred', description:'Predicate to test'},
    ],
    doc:'Returns true if pred returns true for ANY element. Returns false for empty range. O(n). #include <algorithm>',
  },
  {
    label:'none_of', detail:'std::none_of(first, last, pred)', insertText:'none_of', kind:'function',
    returnType:'bool',
    params:[
      {name:'first', type:'InputIt',   description:'Start of range'},
      {name:'last',  type:'InputIt',   description:'End of range'},
      {name:'pred',  type:'UnaryPred', description:'Predicate to test'},
    ],
    doc:'Returns true if pred returns false for ALL elements. Returns true for empty range. O(n). #include <algorithm>',
  },
  {
    label:'for_each', detail:'std::for_each(first, last, fn)', insertText:'for_each', kind:'function',
    returnType:'Function',
    params:[
      {name:'first', type:'InputIt',    description:'Start of range'},
      {name:'last',  type:'InputIt',    description:'End of range'},
      {name:'fn',    type:'UnaryFunc',  description:'Function to apply to each element'},
    ],
    doc:'Applies fn to each element. Returns fn after traversal. O(n).\n\n**Tip:** Prefer range-for for readability. #include <algorithm>',
  },

  // Min/max
  {
    label:'min', detail:'std::min(a, b, comp?)', insertText:'min', kind:'function',
    returnType:'const T&',
    params:[
      {name:'a',    type:'const T&', description:'First value'},
      {name:'b',    type:'const T&', description:'Second value'},
      {name:'comp', type:'Compare',  description:'Optional comparator'},
    ],
    doc:'Returns the smaller of a and b. If equal, returns a.\n\n**Overload:** min({a,b,c,...}) from initializer list. #include <algorithm>',
  },
  {
    label:'max', detail:'std::max(a, b, comp?)', insertText:'max', kind:'function',
    returnType:'const T&',
    params:[
      {name:'a',    type:'const T&', description:'First value'},
      {name:'b',    type:'const T&', description:'Second value'},
      {name:'comp', type:'Compare',  description:'Optional comparator'},
    ],
    doc:'Returns the larger of a and b. If equal, returns a.\n\n**Overload:** max({a,b,c,...}) from initializer list. #include <algorithm>',
  },
  {
    label:'minmax', detail:'std::minmax(a, b)', insertText:'minmax', kind:'function',
    returnType:'pair<const T&, const T&>',
    params:[
      {name:'a', type:'const T&', description:'First value'},
      {name:'b', type:'const T&', description:'Second value'},
    ],
    doc:'Returns {min, max} as a pair in one call. #include <algorithm>',
  },
  {
    label:'min_element', detail:'std::min_element(first, last)', insertText:'min_element', kind:'function',
    returnType:'Iterator',
    params:[
      {name:'first', type:'ForwardIt', description:'Start of range'},
      {name:'last',  type:'ForwardIt', description:'End of range'},
    ],
    doc:'Returns iterator to the minimum element. O(n). #include <algorithm>',
  },
  {
    label:'max_element', detail:'std::max_element(first, last)', insertText:'max_element', kind:'function',
    returnType:'Iterator',
    params:[
      {name:'first', type:'ForwardIt', description:'Start of range'},
      {name:'last',  type:'ForwardIt', description:'End of range'},
    ],
    doc:'Returns iterator to the maximum element. O(n). #include <algorithm>',
  },
  {
    label:'clamp', detail:'std::clamp(v, lo, hi)', insertText:'clamp', kind:'function',
    returnType:'const T&',
    params:[
      {name:'v',  type:'const T&', description:'Value to clamp'},
      {name:'lo', type:'const T&', description:'Lower bound'},
      {name:'hi', type:'const T&', description:'Upper bound'},
    ],
    doc:'Returns lo if v<lo, hi if v>hi, else v. C++17. #include <algorithm>',
  },
  {
    label:'abs', detail:'std::abs(n)', insertText:'abs', kind:'function',
    returnType:'T',
    params:[{name:'n', type:'T', description:'Integer or floating-point value'}],
    doc:'Absolute value. For int: #include <cstdlib>. For float: #include <cmath>.',
  },
  {
    label:'gcd', detail:'std::gcd(m, n)', insertText:'gcd', kind:'function',
    returnType:'T',
    params:[
      {name:'m', type:'M', description:'First integer'},
      {name:'n', type:'N', description:'Second integer'},
    ],
    doc:'Greatest common divisor. C++17. Returns 0 if both are 0. #include <numeric>',
  },
  {
    label:'lcm', detail:'std::lcm(m, n)', insertText:'lcm', kind:'function',
    returnType:'T',
    params:[
      {name:'m', type:'M', description:'First integer'},
      {name:'n', type:'N', description:'Second integer'},
    ],
    doc:'Least common multiple. C++17. Returns 0 if either is 0. #include <numeric>',
  },

  // Numeric
  {
    label:'accumulate', detail:'std::accumulate(first, last, init, op?)', insertText:'accumulate', kind:'function',
    returnType:'T',
    params:[
      {name:'first', type:'InputIt', description:'Start of range'},
      {name:'last',  type:'InputIt', description:'End of range'},
      {name:'init',  type:'T',       description:'Initial value'},
      {name:'op',    type:'BinOp',   description:'Optional binary operation (default: +)'},
    ],
    doc:'Folds range left with op, starting from init.\n\n**Sum example:** `accumulate(v.begin(), v.end(), 0LL)`\n**Product:** `accumulate(v.begin(), v.end(), 1, multiplies<int>())`\n#include <numeric>',
  },
  {
    label:'iota', detail:'std::iota(first, last, value)', insertText:'iota', kind:'function',
    returnType:'void',
    params:[
      {name:'first', type:'ForwardIt', description:'Start of range'},
      {name:'last',  type:'ForwardIt', description:'End of range'},
      {name:'value', type:'T',         description:'Starting value (increments by ++)'},
    ],
    doc:'Fills range with successive values starting from value.\n\n**Example:** `iota(v.begin(), v.end(), 0)` → [0,1,2,...]\n#include <numeric>',
  },

  // Copy / fill
  {
    label:'fill', detail:'std::fill(first, last, value)', insertText:'fill', kind:'function',
    returnType:'void',
    params:[
      {name:'first', type:'ForwardIt', description:'Start of range'},
      {name:'last',  type:'ForwardIt', description:'End of range'},
      {name:'value', type:'const T&',  description:'Value to fill with'},
    ],
    doc:'Assigns value to all elements in [first, last). O(n). #include <algorithm>',
  },
  {
    label:'copy', detail:'std::copy(first, last, d_first)', insertText:'copy', kind:'function',
    returnType:'OutputIt',
    params:[
      {name:'first',   type:'InputIt',  description:'Start of source range'},
      {name:'last',    type:'InputIt',  description:'End of source range'},
      {name:'d_first', type:'OutputIt', description:'Start of destination range'},
    ],
    doc:'Copies elements to destination. Ranges must not overlap (use copy_backward if needed). O(n). #include <algorithm>',
  },
  {
    label:'transform', detail:'std::transform(first, last, d_first, op)', insertText:'transform', kind:'function',
    returnType:'OutputIt',
    params:[
      {name:'first',   type:'InputIt',   description:'Start of input range'},
      {name:'last',    type:'InputIt',   description:'End of input range'},
      {name:'d_first', type:'OutputIt',  description:'Start of output range'},
      {name:'op',      type:'UnaryFunc', description:'Transformation function'},
    ],
    doc:'Applies op to each element and stores result in destination.\n\n**Example:**\n```cpp\ntransform(v.begin(), v.end(), v.begin(), [](int x){ return x*2; });\n```\n#include <algorithm>',
  },
  {
    label:'unique', detail:'std::unique(first, last)', insertText:'unique', kind:'function',
    returnType:'Iterator',
    params:[
      {name:'first', type:'ForwardIt', description:'Start of range (must be sorted for full dedup)'},
      {name:'last',  type:'ForwardIt', description:'End of range'},
    ],
    doc:'Removes consecutive duplicates. Returns new logical end.\n\n**Pattern:**\n```cpp\nv.erase(unique(v.begin(), v.end()), v.end());\n```\n#include <algorithm>',
  },
  {
    label:'merge', detail:'std::merge(first1, last1, first2, last2, d_first)', insertText:'merge', kind:'function',
    returnType:'OutputIt',
    params:[
      {name:'first1',  type:'InputIt',  description:'Start of first sorted range'},
      {name:'last1',   type:'InputIt',  description:'End of first range'},
      {name:'first2',  type:'InputIt',  description:'Start of second sorted range'},
      {name:'last2',   type:'InputIt',  description:'End of second range'},
      {name:'d_first', type:'OutputIt', description:'Destination output iterator'},
    ],
    doc:'Merges two sorted ranges into one sorted output. O(n+m). #include <algorithm>',
  },
  {
    label:'remove', detail:'std::remove(first, last, value)', insertText:'remove', kind:'function',
    returnType:'Iterator',
    params:[
      {name:'first', type:'ForwardIt', description:'Start of range'},
      {name:'last',  type:'ForwardIt', description:'End of range'},
      {name:'value', type:'const T&',  description:'Value to remove'},
    ],
    doc:'Moves elements NOT equal to value to front. Returns new logical end.\n\n**Pattern:**\n```cpp\nv.erase(remove(v.begin(), v.end(), val), v.end());\n```\n#include <algorithm>',
  },

  // Permutations
  {
    label:'next_permutation', detail:'std::next_permutation(first, last)', insertText:'next_permutation', kind:'function',
    returnType:'bool',
    params:[
      {name:'first', type:'BidirIt', description:'Start of range'},
      {name:'last',  type:'BidirIt', description:'End of range'},
    ],
    doc:'Transforms range into next lexicographic permutation. Returns false if it was the last.\n\n**Pattern:**\n```cpp\ndo { /* process */ } while (next_permutation(v.begin(), v.end()));\n```\n#include <algorithm>',
  },
  {
    label:'prev_permutation', detail:'std::prev_permutation(first, last)', insertText:'prev_permutation', kind:'function',
    returnType:'bool',
    params:[
      {name:'first', type:'BidirIt', description:'Start of range'},
      {name:'last',  type:'BidirIt', description:'End of range'},
    ],
    doc:'Transforms range into previous lexicographic permutation. Returns false if it was the first. #include <algorithm>',
  },

  // Set operations
  {
    label:'set_union', detail:'std::set_union(f1,l1,f2,l2,d)', insertText:'set_union', kind:'function',
    returnType:'OutputIt',
    params:[
      {name:'first1',  type:'InputIt',  description:'Start of first sorted range'},
      {name:'last1',   type:'InputIt',  description:'End of first range'},
      {name:'first2',  type:'InputIt',  description:'Start of second sorted range'},
      {name:'last2',   type:'InputIt',  description:'End of second range'},
      {name:'d_first', type:'OutputIt', description:'Destination'},
    ],
    doc:'Computes sorted union of two sorted ranges. #include <algorithm>',
  },
  {
    label:'set_intersection', detail:'std::set_intersection(f1,l1,f2,l2,d)', insertText:'set_intersection', kind:'function',
    returnType:'OutputIt',
    params:[
      {name:'first1',  type:'InputIt',  description:'Start of first sorted range'},
      {name:'last1',   type:'InputIt',  description:'End of first range'},
      {name:'first2',  type:'InputIt',  description:'Start of second sorted range'},
      {name:'last2',   type:'InputIt',  description:'End of second range'},
      {name:'d_first', type:'OutputIt', description:'Destination'},
    ],
    doc:'Computes sorted intersection of two sorted ranges. #include <algorithm>',
  },
  {
    label:'set_difference', detail:'std::set_difference(f1,l1,f2,l2,d)', insertText:'set_difference', kind:'function',
    returnType:'OutputIt',
    params:[
      {name:'first1',  type:'InputIt',  description:'Start of first sorted range (minuend)'},
      {name:'last1',   type:'InputIt',  description:'End of first range'},
      {name:'first2',  type:'InputIt',  description:'Start of second sorted range (subtrahend)'},
      {name:'last2',   type:'InputIt',  description:'End of second range'},
      {name:'d_first', type:'OutputIt', description:'Destination'},
    ],
    doc:'Elements in first range but not second. #include <algorithm>',
  },

  // String conversions
  {
    label:'stoi', detail:'std::stoi(str, pos?, base?)', insertText:'stoi', kind:'function',
    returnType:'int',
    params:[
      {name:'str',  type:'const string&', description:'String to convert'},
      {name:'pos',  type:'size_t*',        description:'Optional: stores position of first unconverted char'},
      {name:'base', type:'int',            description:'Number base (default 10)'},
    ],
    doc:'Converts string to int. Throws std::invalid_argument or std::out_of_range on failure. #include <string>',
  },
  {
    label:'stol', detail:'std::stol(str)', insertText:'stol', kind:'function',
    returnType:'long',
    params:[{name:'str', type:'const string&', description:'String to convert'}],
    doc:'Converts string to long. #include <string>',
  },
  {
    label:'stoll', detail:'std::stoll(str)', insertText:'stoll', kind:'function',
    returnType:'long long',
    params:[{name:'str', type:'const string&', description:'String to convert'}],
    doc:'Converts string to long long. #include <string>',
  },
  {
    label:'to_string', detail:'std::to_string(value)', insertText:'to_string', kind:'function',
    returnType:'string',
    params:[{name:'value', type:'T', description:'Numeric value (int/long/float/double)'}],
    doc:'Converts numeric value to std::string. #include <string>',
  },
  {
    label:'stof', detail:'std::stof(str)', insertText:'stof', kind:'function',
    returnType:'float',
    params:[{name:'str', type:'const string&', description:'String to convert'}],
    doc:'Converts string to float. #include <string>',
  },
  {
    label:'stod', detail:'std::stod(str)', insertText:'stod', kind:'function',
    returnType:'double',
    params:[{name:'str', type:'const string&', description:'String to convert'}],
    doc:'Converts string to double. #include <string>',
  },

  // Utility
  {
    label:'make_pair', detail:'std::make_pair(t, u)', insertText:'make_pair', kind:'function',
    returnType:'pair<T,U>',
    params:[
      {name:'t', type:'T', description:'First element'},
      {name:'u', type:'U', description:'Second element'},
    ],
    doc:'Creates a pair from two values. Types are deduced automatically. #include <utility>',
  },
  {
    label:'make_tuple', detail:'std::make_tuple(args...)', insertText:'make_tuple', kind:'function',
    returnType:'tuple<...>',
    params:[{name:'args...', type:'T...', description:'Values to pack into tuple'}],
    doc:'Creates a tuple from multiple values. #include <tuple>',
  },
  {
    label:'get', detail:'std::get<N>(tuple)', insertText:'get', kind:'function',
    returnType:'T&',
    params:[
      {name:'N',   type:'size_t',    description:'Index (compile-time constant)'},
      {name:'tpl', type:'tuple<...>', description:'Tuple to access'},
    ],
    doc:'Access Nth element of a tuple or pair. Also works with std::array. #include <tuple>',
  },
  {
    label:'swap', detail:'std::swap(a, b)', insertText:'swap', kind:'function',
    returnType:'void',
    params:[
      {name:'a', type:'T&', description:'First value'},
      {name:'b', type:'T&', description:'Second value'},
    ],
    doc:'Exchanges values of a and b efficiently (move semantics). #include <utility>',
  },
  {
    label:'move', detail:'std::move(t)', insertText:'move', kind:'function',
    returnType:'T&&',
    params:[{name:'t', type:'T&', description:'Object to move'}],
    doc:'Casts to rvalue reference — enables move semantics. Object may be in valid but unspecified state afterward. #include <utility>',
  },
  {
    label:'forward', detail:'std::forward<T>(t)', insertText:'forward', kind:'function',
    returnType:'T&&',
    params:[
      {name:'T', type:'type', description:'Type to forward as'},
      {name:'t', type:'T&&', description:'Value to forward'},
    ],
    doc:'Perfect forwarding — preserves lvalue/rvalue category. Use in templates. #include <utility>',
  },
  {
    label:'make_unique', detail:'std::make_unique<T>(args...)', insertText:'make_unique', kind:'function',
    returnType:'unique_ptr<T>',
    params:[{name:'args...', type:'Args&&', description:'Constructor arguments for T'}],
    doc:'Creates a unique_ptr<T>. Preferred over `new` for exception safety. C++14. #include <memory>',
  },
  {
    label:'make_shared', detail:'std::make_shared<T>(args...)', insertText:'make_shared', kind:'function',
    returnType:'shared_ptr<T>',
    params:[{name:'args...', type:'Args&&', description:'Constructor arguments for T'}],
    doc:'Creates a shared_ptr<T> with single allocation. Preferred over shared_ptr(new T). #include <memory>',
  },
  {
    label:'exchange', detail:'std::exchange(obj, new_value)', insertText:'exchange', kind:'function',
    returnType:'T',
    params:[
      {name:'obj',       type:'T&', description:'Object to replace'},
      {name:'new_value', type:'U',  description:'New value to assign'},
    ],
    doc:'Replaces obj with new_value, returns old value. C++14. Useful in move constructors. #include <utility>',
  },

  // Math
  {
    label:'sqrt', detail:'std::sqrt(x)', insertText:'sqrt', kind:'function',
    returnType:'double',
    params:[{name:'x', type:'double', description:'Non-negative value'}],
    doc:'Square root. Returns NaN for negative input. #include <cmath>',
  },
  {
    label:'pow', detail:'std::pow(base, exp)', insertText:'pow', kind:'function',
    returnType:'double',
    params:[
      {name:'base', type:'double', description:'Base value'},
      {name:'exp',  type:'double', description:'Exponent'},
    ],
    doc:'Raises base to the power exp. Use integer exponentiation for integers to avoid precision loss. #include <cmath>',
  },
  {
    label:'log', detail:'std::log(x)', insertText:'log', kind:'function',
    returnType:'double',
    params:[{name:'x', type:'double', description:'Positive value'}],
    doc:'Natural logarithm (base e). #include <cmath>',
  },
  {
    label:'log2', detail:'std::log2(x)', insertText:'log2', kind:'function',
    returnType:'double',
    params:[{name:'x', type:'double', description:'Positive value'}],
    doc:'Base-2 logarithm. Useful for bit operations. #include <cmath>',
  },
  {
    label:'log10', detail:'std::log10(x)', insertText:'log10', kind:'function',
    returnType:'double',
    params:[{name:'x', type:'double', description:'Positive value'}],
    doc:'Base-10 logarithm. #include <cmath>',
  },
  {
    label:'ceil', detail:'std::ceil(x)', insertText:'ceil', kind:'function',
    returnType:'double',
    params:[{name:'x', type:'double', description:'Value to round up'}],
    doc:'Rounds up to nearest integer. #include <cmath>',
  },
  {
    label:'floor', detail:'std::floor(x)', insertText:'floor', kind:'function',
    returnType:'double',
    params:[{name:'x', type:'double', description:'Value to round down'}],
    doc:'Rounds down to nearest integer. #include <cmath>',
  },
  {
    label:'round', detail:'std::round(x)', insertText:'round', kind:'function',
    returnType:'double',
    params:[{name:'x', type:'double', description:'Value to round'}],
    doc:'Rounds to nearest integer (0.5 rounds away from zero). #include <cmath>',
  },
  {
    label:'sin',  detail:'std::sin(x)',  insertText:'sin',  kind:'function',
    returnType:'double',
    params:[{name:'x', type:'double', description:'Angle in radians'}],
    doc:'Sine of angle in radians. #include <cmath>',
  },
  {
    label:'cos',  detail:'std::cos(x)',  insertText:'cos',  kind:'function',
    returnType:'double',
    params:[{name:'x', type:'double', description:'Angle in radians'}],
    doc:'Cosine of angle in radians. #include <cmath>',
  },
  {
    label:'atan2', detail:'std::atan2(y, x)', insertText:'atan2', kind:'function',
    returnType:'double',
    params:[
      {name:'y', type:'double', description:'Y coordinate'},
      {name:'x', type:'double', description:'X coordinate'},
    ],
    doc:'Arc tangent of y/x. Returns angle in radians in range [-π, π]. Handles x=0. #include <cmath>',
  },
  {
    label:'hypot', detail:'std::hypot(x, y)', insertText:'hypot', kind:'function',
    returnType:'double',
    params:[
      {name:'x', type:'double', description:'X component'},
      {name:'y', type:'double', description:'Y component'},
    ],
    doc:'Euclidean distance sqrt(x²+y²). C++17 supports 3-arg hypot(x,y,z). #include <cmath>',
  },
  {
    label:'fmod', detail:'std::fmod(x, y)', insertText:'fmod', kind:'function',
    returnType:'double',
    params:[
      {name:'x', type:'double', description:'Dividend'},
      {name:'y', type:'double', description:'Divisor'},
    ],
    doc:'Floating-point remainder of x/y. Sign matches x. #include <cmath>',
  },

  // I/O
  {
    label:'printf', detail:'printf(format, args...)', insertText:'printf', kind:'function',
    returnType:'int',
    params:[
      {name:'format', type:'const char*', description:'Format string (%d, %s, %f, %lld, %c...)'},
      {name:'args...', type:'...', description:'Values to format'},
    ],
    doc:'Formatted output to stdout. Returns number of characters written.\n\n**Format specifiers:** `%d` int, `%lld` long long, `%f` float, `%lf` double, `%s` string, `%c` char\n#include <cstdio>',
  },
  {
    label:'scanf', detail:'scanf(format, args...)', insertText:'scanf', kind:'function',
    returnType:'int',
    params:[
      {name:'format', type:'const char*', description:'Format string'},
      {name:'args...', type:'T*...', description:'Pointers to variables to fill'},
    ],
    doc:'Formatted input from stdin. Returns number of items read. Pass variable addresses with &.\n#include <cstdio>',
  },
  {
    label:'sprintf', detail:'sprintf(buf, format, args...)', insertText:'sprintf', kind:'function',
    returnType:'int',
    params:[
      {name:'buf',    type:'char*',       description:'Output buffer'},
      {name:'format', type:'const char*', description:'Format string'},
      {name:'args...', type:'...',        description:'Values to format'},
    ],
    doc:'Writes formatted string to buffer. Returns number of chars written (excluding null). Prefer snprintf. #include <cstdio>',
  },
  {
    label:'sscanf', detail:'sscanf(str, format, args...)', insertText:'sscanf', kind:'function',
    returnType:'int',
    params:[
      {name:'str',    type:'const char*', description:'Input string'},
      {name:'format', type:'const char*', description:'Format string'},
      {name:'args...', type:'T*...',      description:'Pointers to variables'},
    ],
    doc:'Reads formatted data from a string. #include <cstdio>',
  },

  // C string
  {
    label:'memset', detail:'memset(ptr, value, count)', insertText:'memset', kind:'function',
    returnType:'void*',
    params:[
      {name:'ptr',   type:'void*', description:'Memory to fill'},
      {name:'value', type:'int',   description:'Byte value (0x00, 0xFF, etc.)'},
      {name:'count', type:'size_t',description:'Number of bytes to fill'},
    ],
    doc:'Fills memory with a byte value. Common: `memset(arr, 0, sizeof arr)` to zero-initialize.\n\n**Warning:** Not safe for non-trivial types. #include <cstring>',
  },
  {
    label:'memcpy', detail:'memcpy(dest, src, count)', insertText:'memcpy', kind:'function',
    returnType:'void*',
    params:[
      {name:'dest',  type:'void*',       description:'Destination (must not overlap with src)'},
      {name:'src',   type:'const void*', description:'Source'},
      {name:'count', type:'size_t',      description:'Number of bytes to copy'},
    ],
    doc:'Copies count bytes from src to dest. Ranges must not overlap (use memmove if needed). #include <cstring>',
  },
  {
    label:'strlen', detail:'strlen(str)', insertText:'strlen', kind:'function',
    returnType:'size_t',
    params:[{name:'str', type:'const char*', description:'Null-terminated string'}],
    doc:'Returns length of C-string (not including null terminator). O(n). #include <cstring>',
  },
];

// ── Container Method Signatures ────────────────────────────────────────────
interface MethodDef {
  name:        string;
  detail:      string;
  doc:         string;
  params?:     Param[];
  returnType?: string;
}

const CONTAINER_METHOD_DEFS: Record<string, MethodDef[]> = {
  vector: [
    { name:'push_back',    detail:'void push_back(const T& val)', returnType:'void',
      params:[{name:'val', type:'const T&', description:'Element to append'}],
      doc:'Appends element to end. Amortized O(1). May trigger reallocation.' },
    { name:'emplace_back', detail:'T& emplace_back(args...)', returnType:'T&',
      params:[{name:'args...', type:'Args&&', description:'Constructor arguments'}],
      doc:'Constructs element in-place at end. Avoids copy. Returns reference to new element (C++17).' },
    { name:'pop_back',     detail:'void pop_back()', returnType:'void', params:[],
      doc:'Removes last element. O(1). Undefined if empty.' },
    { name:'size',         detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of elements. O(1).' },
    { name:'empty',        detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if vector has no elements.' },
    { name:'clear',        detail:'void clear()', returnType:'void', params:[],
      doc:'Removes all elements. Capacity unchanged.' },
    { name:'front',        detail:'T& front()', returnType:'T&', params:[],
      doc:'Reference to first element. Undefined if empty.' },
    { name:'back',         detail:'T& back()', returnType:'T&', params:[],
      doc:'Reference to last element. Undefined if empty.' },
    { name:'at',           detail:'T& at(size_t n)', returnType:'T&',
      params:[{name:'n', type:'size_t', description:'Index (bounds-checked)'}],
      doc:'Bounds-checked access. Throws std::out_of_range if n >= size().' },
    { name:'reserve',      detail:'void reserve(size_t n)', returnType:'void',
      params:[{name:'n', type:'size_t', description:'Minimum capacity to reserve'}],
      doc:'Pre-allocates capacity for n elements. Prevents reallocation during push_back.' },
    { name:'resize',       detail:'void resize(size_t n, T val?)', returnType:'void',
      params:[
        {name:'n',   type:'size_t', description:'New size'},
        {name:'val', type:'T',      description:'Value for new elements (default: T())'},
      ],
      doc:'Changes size to n. New elements initialized to val if growing.' },
    { name:'capacity',     detail:'size_t capacity() const', returnType:'size_t', params:[],
      doc:'Allocated storage capacity (>= size()). O(1).' },
    { name:'begin',        detail:'iterator begin()', returnType:'iterator', params:[],
      doc:'Iterator to first element.' },
    { name:'end',          detail:'iterator end()', returnType:'iterator', params:[],
      doc:'Iterator past the last element.' },
    { name:'insert',       detail:'iterator insert(pos, val)', returnType:'iterator',
      params:[
        {name:'pos', type:'iterator', description:'Position to insert before'},
        {name:'val', type:'const T&', description:'Value to insert'},
      ],
      doc:'Inserts val before pos. O(n). Returns iterator to inserted element.' },
    { name:'erase',        detail:'iterator erase(pos)', returnType:'iterator',
      params:[{name:'pos', type:'iterator', description:'Position or range to erase'}],
      doc:'Removes element at pos. Returns iterator to next element. O(n).' },
    { name:'assign',       detail:'void assign(count, val)', returnType:'void',
      params:[
        {name:'count', type:'size_t', description:'Number of elements'},
        {name:'val',   type:'const T&', description:'Value to assign'},
      ],
      doc:'Replaces contents with count copies of val.' },
    { name:'swap',         detail:'void swap(vector& other)', returnType:'void',
      params:[{name:'other', type:'vector<T>&', description:'Vector to swap with'}],
      doc:'Swaps contents with other in O(1).' },
    { name:'data',         detail:'T* data()', returnType:'T*', params:[],
      doc:'Returns pointer to underlying array. Useful for C API interop.' },
  ],

  string: [
    { name:'size',         detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of characters (not including null). Same as length().' },
    { name:'length',       detail:'size_t length() const', returnType:'size_t', params:[],
      doc:'Number of characters. Same as size().' },
    { name:'empty',        detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if string has no characters.' },
    { name:'clear',        detail:'void clear()', returnType:'void', params:[],
      doc:'Clears the string to empty.' },
    { name:'push_back',    detail:'void push_back(char c)', returnType:'void',
      params:[{name:'c', type:'char', description:'Character to append'}],
      doc:'Appends a single character.' },
    { name:'pop_back',     detail:'void pop_back()', returnType:'void', params:[],
      doc:'Removes last character. C++11.' },
    { name:'append',       detail:'string& append(str)', returnType:'string&',
      params:[{name:'str', type:'const string&', description:'String to append'}],
      doc:'Appends str. Also accepts (count, char) or (c_str). Returns *this for chaining.' },
    { name:'substr',       detail:'string substr(pos, len?)', returnType:'string',
      params:[
        {name:'pos', type:'size_t', description:'Starting position'},
        {name:'len', type:'size_t', description:'Length (default: to end)'},
      ],
      doc:'Returns substring starting at pos with length len. O(len).' },
    { name:'find',         detail:'size_t find(str, pos?)', returnType:'size_t',
      params:[
        {name:'str', type:'const string&', description:'Substring to find'},
        {name:'pos', type:'size_t',        description:'Starting position (default: 0)'},
      ],
      doc:'Returns index of first occurrence, or string::npos if not found.' },
    { name:'rfind',        detail:'size_t rfind(str, pos?)', returnType:'size_t',
      params:[
        {name:'str', type:'const string&', description:'Substring to find'},
        {name:'pos', type:'size_t',        description:'Starting position from end'},
      ],
      doc:'Returns index of last occurrence, or string::npos.' },
    { name:'replace',      detail:'string& replace(pos, len, str)', returnType:'string&',
      params:[
        {name:'pos', type:'size_t',        description:'Start position'},
        {name:'len', type:'size_t',        description:'Length of replaced portion'},
        {name:'str', type:'const string&', description:'Replacement string'},
      ],
      doc:'Replaces [pos, pos+len) with str.' },
    { name:'erase',        detail:'string& erase(pos, len?)', returnType:'string&',
      params:[
        {name:'pos', type:'size_t', description:'Start position'},
        {name:'len', type:'size_t', description:'Number of chars to remove (default: to end)'},
      ],
      doc:'Removes len characters starting at pos.' },
    { name:'insert',       detail:'string& insert(pos, str)', returnType:'string&',
      params:[
        {name:'pos', type:'size_t',        description:'Insertion position'},
        {name:'str', type:'const string&', description:'String to insert'},
      ],
      doc:'Inserts str before position pos.' },
    { name:'at',           detail:'char& at(size_t n)', returnType:'char&',
      params:[{name:'n', type:'size_t', description:'Index (bounds-checked)'}],
      doc:'Bounds-checked character access. Throws out_of_range.' },
    { name:'front',        detail:'char& front()', returnType:'char&', params:[],
      doc:'Reference to first character.' },
    { name:'back',         detail:'char& back()', returnType:'char&', params:[],
      doc:'Reference to last character.' },
    { name:'c_str',        detail:'const char* c_str() const', returnType:'const char*', params:[],
      doc:'Returns null-terminated C-string. Valid until string is modified.' },
    { name:'begin',        detail:'iterator begin()', returnType:'iterator', params:[],
      doc:'Iterator to first character.' },
    { name:'end',          detail:'iterator end()', returnType:'iterator', params:[],
      doc:'Iterator past last character.' },
    { name:'compare',      detail:'int compare(str) const', returnType:'int',
      params:[{name:'str', type:'const string&', description:'String to compare with'}],
      doc:'Lexicographic comparison. Returns <0, 0, or >0.' },
    { name:'starts_with',  detail:'bool starts_with(str) const', returnType:'bool',
      params:[{name:'str', type:'string_view', description:'Prefix to check'}],
      doc:'Returns true if string starts with str. C++20.' },
    { name:'ends_with',    detail:'bool ends_with(str) const', returnType:'bool',
      params:[{name:'str', type:'string_view', description:'Suffix to check'}],
      doc:'Returns true if string ends with str. C++20.' },
    { name:'contains',     detail:'bool contains(str) const', returnType:'bool',
      params:[{name:'str', type:'string_view', description:'Substring to find'}],
      doc:'Returns true if string contains str. C++23.' },
  ],

  map: [
    { name:'insert',      detail:'pair<iterator,bool> insert({key, val})', returnType:'pair<iterator,bool>',
      params:[{name:'value', type:'value_type', description:'Key-value pair to insert'}],
      doc:'Inserts element. Returns {iterator, true} if inserted, {iterator, false} if key existed.' },
    { name:'emplace',     detail:'pair<iterator,bool> emplace(key, val)', returnType:'pair<iterator,bool>',
      params:[{name:'args...', type:'Args&&', description:'Constructor arguments for key and value'}],
      doc:'Constructs element in-place. Avoids copy of value.' },
    { name:'find',        detail:'iterator find(key)', returnType:'iterator',
      params:[{name:'key', type:'const Key&', description:'Key to search for'}],
      doc:'Returns iterator to element or end() if not found. O(log n).' },
    { name:'count',       detail:'size_t count(key)', returnType:'size_t',
      params:[{name:'key', type:'const Key&', description:'Key to count'}],
      doc:'Returns 0 or 1 (map has unique keys). Use contains() in C++20.' },
    { name:'erase',       detail:'size_t erase(key)', returnType:'size_t',
      params:[{name:'key', type:'const Key&', description:'Key to erase'}],
      doc:'Removes element with given key. Returns number removed (0 or 1).' },
    { name:'clear',       detail:'void clear()', returnType:'void', params:[],
      doc:'Removes all elements.' },
    { name:'size',        detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of elements.' },
    { name:'empty',       detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if map has no elements.' },
    { name:'at',          detail:'V& at(key)', returnType:'V&',
      params:[{name:'key', type:'const Key&', description:'Key (throws if not found)'}],
      doc:'Bounds-checked access. Throws std::out_of_range if key not found.' },
    { name:'begin',       detail:'iterator begin()', returnType:'iterator', params:[],
      doc:'Iterator to first element (smallest key in ordered map).' },
    { name:'end',         detail:'iterator end()', returnType:'iterator', params:[],
      doc:'Iterator past last element.' },
    { name:'lower_bound', detail:'iterator lower_bound(key)', returnType:'iterator',
      params:[{name:'key', type:'const Key&', description:'Key to search for'}],
      doc:'First element with key >= given key. O(log n).' },
    { name:'upper_bound', detail:'iterator upper_bound(key)', returnType:'iterator',
      params:[{name:'key', type:'const Key&', description:'Key to search for'}],
      doc:'First element with key > given key. O(log n).' },
  ],

  unordered_map: [
    { name:'insert',       detail:'pair<iterator,bool> insert({key, val})', returnType:'pair<iterator,bool>',
      params:[{name:'value', type:'value_type', description:'Key-value pair'}],
      doc:'Inserts element. O(1) average.' },
    { name:'emplace',      detail:'pair<iterator,bool> emplace(args...)', returnType:'pair<iterator,bool>',
      params:[{name:'args...', type:'Args&&', description:'Constructor arguments'}],
      doc:'In-place construction. O(1) average.' },
    { name:'find',         detail:'iterator find(key)', returnType:'iterator',
      params:[{name:'key', type:'const Key&', description:'Key to find'}],
      doc:'Returns iterator or end(). O(1) average.' },
    { name:'count',        detail:'size_t count(key)', returnType:'size_t',
      params:[{name:'key', type:'const Key&', description:'Key to count'}],
      doc:'Returns 0 or 1. O(1) average.' },
    { name:'erase',        detail:'size_t erase(key)', returnType:'size_t',
      params:[{name:'key', type:'const Key&', description:'Key to erase'}],
      doc:'Removes element. Returns count removed. O(1) average.' },
    { name:'clear',        detail:'void clear()', returnType:'void', params:[],
      doc:'Removes all elements.' },
    { name:'size',         detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of elements.' },
    { name:'empty',        detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if empty.' },
    { name:'at',           detail:'V& at(key)', returnType:'V&',
      params:[{name:'key', type:'const Key&', description:'Key (throws if not found)'}],
      doc:'Bounds-checked access. Throws if not found.' },
    { name:'bucket_count', detail:'size_t bucket_count() const', returnType:'size_t', params:[],
      doc:'Number of buckets in hash table.' },
    { name:'load_factor',  detail:'float load_factor() const', returnType:'float', params:[],
      doc:'Average elements per bucket. Rehash occurs when > max_load_factor.' },
    { name:'reserve',      detail:'void reserve(n)', returnType:'void',
      params:[{name:'n', type:'size_t', description:'Expected number of elements'}],
      doc:'Reserves space for n elements. Prevents rehashing.' },
  ],

  set: [
    { name:'insert',       detail:'pair<iterator,bool> insert(val)', returnType:'pair<iterator,bool>',
      params:[{name:'val', type:'const T&', description:'Value to insert'}],
      doc:'Inserts value. Returns {iterator, true} if new, {iterator, false} if existed. O(log n).' },
    { name:'emplace',      detail:'pair<iterator,bool> emplace(args...)', returnType:'pair<iterator,bool>',
      params:[{name:'args...', type:'Args&&', description:'Constructor arguments'}],
      doc:'In-place insertion. O(log n).' },
    { name:'find',         detail:'iterator find(val)', returnType:'iterator',
      params:[{name:'val', type:'const T&', description:'Value to find'}],
      doc:'Returns iterator or end(). O(log n).' },
    { name:'count',        detail:'size_t count(val)', returnType:'size_t',
      params:[{name:'val', type:'const T&', description:'Value to count'}],
      doc:'Returns 0 or 1. O(log n). Use contains() in C++20.' },
    { name:'erase',        detail:'size_t erase(val)', returnType:'size_t',
      params:[{name:'val', type:'const T&', description:'Value or iterator to erase'}],
      doc:'Removes element. Returns count removed. O(log n).' },
    { name:'clear',        detail:'void clear()', returnType:'void', params:[],
      doc:'Removes all elements.' },
    { name:'size',         detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of elements.' },
    { name:'empty',        detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if set is empty.' },
    { name:'begin',        detail:'iterator begin()', returnType:'iterator', params:[],
      doc:'Iterator to smallest element.' },
    { name:'end',          detail:'iterator end()', returnType:'iterator', params:[],
      doc:'Iterator past last element.' },
    { name:'lower_bound',  detail:'iterator lower_bound(val)', returnType:'iterator',
      params:[{name:'val', type:'const T&', description:'Value to search for'}],
      doc:'First element >= val. O(log n).' },
    { name:'upper_bound',  detail:'iterator upper_bound(val)', returnType:'iterator',
      params:[{name:'val', type:'const T&', description:'Value to search for'}],
      doc:'First element > val. O(log n).' },
  ],

  unordered_set: [
    { name:'insert',  detail:'pair<iterator,bool> insert(val)', returnType:'pair<iterator,bool>',
      params:[{name:'val', type:'const T&', description:'Value to insert'}],
      doc:'Inserts value. O(1) average.' },
    { name:'find',    detail:'iterator find(val)', returnType:'iterator',
      params:[{name:'val', type:'const T&', description:'Value to find'}],
      doc:'Returns iterator or end(). O(1) average.' },
    { name:'count',   detail:'size_t count(val)', returnType:'size_t',
      params:[{name:'val', type:'const T&', description:'Value to count'}],
      doc:'Returns 0 or 1. O(1) average.' },
    { name:'erase',   detail:'size_t erase(val)', returnType:'size_t',
      params:[{name:'val', type:'const T&', description:'Value to erase'}],
      doc:'Removes element. O(1) average.' },
    { name:'clear',   detail:'void clear()', returnType:'void', params:[],
      doc:'Removes all elements.' },
    { name:'size',    detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of elements.' },
    { name:'empty',   detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if empty.' },
    { name:'reserve', detail:'void reserve(n)', returnType:'void',
      params:[{name:'n', type:'size_t', description:'Expected element count'}],
      doc:'Reserve space for n elements.' },
  ],

  queue: [
    { name:'push',  detail:'void push(val)', returnType:'void',
      params:[{name:'val', type:'const T&', description:'Value to enqueue'}],
      doc:'Enqueues element at back. O(1).' },
    { name:'emplace',detail:'void emplace(args...)', returnType:'void',
      params:[{name:'args...', type:'Args&&', description:'Constructor arguments'}],
      doc:'Constructs element in-place at back.' },
    { name:'pop',   detail:'void pop()', returnType:'void', params:[],
      doc:'Removes front element (FIFO). O(1). Undefined if empty.' },
    { name:'front', detail:'T& front()', returnType:'T&', params:[],
      doc:'Reference to front element (next to be popped).' },
    { name:'back',  detail:'T& back()', returnType:'T&', params:[],
      doc:'Reference to back element (last pushed).' },
    { name:'size',  detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of elements.' },
    { name:'empty', detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if queue is empty.' },
  ],

  stack: [
    { name:'push',   detail:'void push(val)', returnType:'void',
      params:[{name:'val', type:'const T&', description:'Value to push'}],
      doc:'Pushes element on top. O(1).' },
    { name:'emplace',detail:'void emplace(args...)', returnType:'void',
      params:[{name:'args...', type:'Args&&', description:'Constructor arguments'}],
      doc:'Constructs element in-place on top.' },
    { name:'pop',    detail:'void pop()', returnType:'void', params:[],
      doc:'Removes top element. O(1). Undefined if empty.' },
    { name:'top',    detail:'T& top()', returnType:'T&', params:[],
      doc:'Reference to top element (last pushed, first to pop).' },
    { name:'size',   detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of elements.' },
    { name:'empty',  detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if stack is empty.' },
  ],

  priority_queue: [
    { name:'push',   detail:'void push(val)', returnType:'void',
      params:[{name:'val', type:'const T&', description:'Value to insert'}],
      doc:'Inserts element. O(log n). Max-heap by default.' },
    { name:'emplace',detail:'void emplace(args...)', returnType:'void',
      params:[{name:'args...', type:'Args&&', description:'Constructor arguments'}],
      doc:'Constructs element in-place. O(log n).' },
    { name:'pop',    detail:'void pop()', returnType:'void', params:[],
      doc:'Removes top element (maximum). O(log n). Undefined if empty.' },
    { name:'top',    detail:'const T& top() const', returnType:'const T&', params:[],
      doc:'Returns reference to maximum element. O(1).' },
    { name:'size',   detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of elements.' },
    { name:'empty',  detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if empty.' },
  ],

  deque: [
    { name:'push_back',  detail:'void push_back(val)', returnType:'void',
      params:[{name:'val', type:'const T&', description:'Value to append'}],
      doc:'Appends to back. O(1).' },
    { name:'push_front', detail:'void push_front(val)', returnType:'void',
      params:[{name:'val', type:'const T&', description:'Value to prepend'}],
      doc:'Prepends to front. O(1).' },
    { name:'pop_back',   detail:'void pop_back()', returnType:'void', params:[],
      doc:'Removes last element. O(1).' },
    { name:'pop_front',  detail:'void pop_front()', returnType:'void', params:[],
      doc:'Removes first element. O(1).' },
    { name:'front',      detail:'T& front()', returnType:'T&', params:[],
      doc:'Reference to first element.' },
    { name:'back',       detail:'T& back()', returnType:'T&', params:[],
      doc:'Reference to last element.' },
    { name:'size',       detail:'size_t size() const', returnType:'size_t', params:[],
      doc:'Number of elements.' },
    { name:'empty',      detail:'bool empty() const', returnType:'bool', params:[],
      doc:'Returns true if empty.' },
    { name:'clear',      detail:'void clear()', returnType:'void', params:[],
      doc:'Removes all elements.' },
    { name:'at',         detail:'T& at(n)', returnType:'T&',
      params:[{name:'n', type:'size_t', description:'Index (bounds-checked)'}],
      doc:'Bounds-checked access.' },
    { name:'begin',      detail:'iterator begin()', returnType:'iterator', params:[],
      doc:'Iterator to first element.' },
    { name:'end',        detail:'iterator end()', returnType:'iterator', params:[],
      doc:'Iterator past last element.' },
  ],

  pair: [
    { name:'first',  detail:'T1 first', returnType:'T1', params:[],
      doc:'First element of the pair. Accessed as .first' },
    { name:'second', detail:'T2 second', returnType:'T2', params:[],
      doc:'Second element of the pair. Accessed as .second' },
  ],
};

// ── Rich Snippets ─────────────────────────────────────────────────────────
const SNIPPETS: SuggestionDef[] = [
  {
    label:'#include bits',
    detail:'#include <bits/stdc++.h>',
    kind:'snippet',
    insertText:'#include <bits/stdc++.h>',
    doc:'Include everything — competitive programming shortcut.',
  },
  {
    label:'cp-main',
    detail:'Competitive programming boilerplate',
    kind:'snippet',
    insertText:'#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\tios_base::sync_with_stdio(false);\n\tcin.tie(NULL);\n\t\n\t${1}\n\treturn 0;\n}',
    doc:'Full CP boilerplate with fast I/O.',
  },
  {
    label:'fori',
    detail:'for (int i = 0; i < n; i++)',
    kind:'snippet',
    insertText:'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}',
    doc:'Classic index-based for loop.',
  },
  {
    label:'for range',
    detail:'for (auto& x : container)',
    kind:'snippet',
    insertText:'for (auto& ${1:x} : ${2:container}) {\n\t${3}\n}',
    doc:'Range-based for loop (C++11). Use const auto& for read-only.',
  },
  {
    label:'while',
    detail:'while (condition)',
    kind:'snippet',
    insertText:'while (${1:condition}) {\n\t${2}\n}',
    doc:'While loop.',
  },
  {
    label:'vec',
    detail:'vector<T> v(n)',
    kind:'snippet',
    insertText:'vector<${1:int}> ${2:v}(${3:n});',
    doc:'Declare a vector of size n.',
  },
  {
    label:'vec2d',
    detail:'2D vector',
    kind:'snippet',
    insertText:'vector<vector<${1:int}>> ${2:grid}(${3:n}, vector<${1:int}>(${4:m}, ${5:0}));',
    doc:'Declare a 2D vector initialized to 0.',
  },
  {
    label:'pq',
    detail:'priority_queue (max-heap)',
    kind:'snippet',
    insertText:'priority_queue<${1:int}> ${2:pq};',
    doc:'Max priority queue.',
  },
  {
    label:'pqmin',
    detail:'priority_queue (min-heap)',
    kind:'snippet',
    insertText:'priority_queue<${1:int}, vector<${1:int}>, greater<${1:int}>> ${2:pq};',
    doc:'Min priority queue.',
  },
  {
    label:'mp',
    detail:'map<K,V>',
    kind:'snippet',
    insertText:'map<${1:string}, ${2:int}> ${3:mp};',
    doc:'Ordered map.',
  },
  {
    label:'ump',
    detail:'unordered_map<K,V>',
    kind:'snippet',
    insertText:'unordered_map<${1:string}, ${2:int}> ${3:ump};',
    doc:'Hash map (faster, unordered).',
  },
  {
    label:'lambda',
    detail:'auto fn = [&](args) { ... }',
    kind:'snippet',
    insertText:'auto ${1:fn} = [${2:&}](${3:int x}) {\n\t${4:return x;}\n};',
    doc:'Lambda function with capture.',
  },
  {
    label:'struct',
    detail:'struct with operator<',
    kind:'snippet',
    insertText:'struct ${1:Node} {\n\t${2:int val, idx;}\n\tbool operator<(const ${1:Node}& o) const {\n\t\treturn ${3:val < o.val};\n\t}\n};',
    doc:'Struct with comparison for sorting/priority_queue.',
  },
  {
    label:'class',
    detail:'class definition',
    kind:'snippet',
    insertText:'class ${1:MyClass} {\npublic:\n\t${1:MyClass}(${2}) : ${3} {}\n\t${4}\nprivate:\n\t${5}\n};',
    doc:'Class with constructor.',
  },
  {
    label:'ifmain',
    detail:'if __name__ == "__main__"  (Python)',
    kind:'snippet',
    insertText:'if __name__ == "__main__":\n\t${1:main()}',
    doc:'Python entry point guard.',
  },
  {
    label:'sort-desc',
    detail:'sort descending',
    kind:'snippet',
    insertText:'sort(${1:v}.begin(), ${1:v}.end(), greater<${2:int}>());',
    doc:'Sort in descending order.',
  },
  {
    label:'sort-lambda',
    detail:'sort with custom comparator',
    kind:'snippet',
    insertText:'sort(${1:v}.begin(), ${1:v}.end(), [](const ${2:auto}& a, const ${2:auto}& b) {\n\treturn ${3:a < b};\n});',
    doc:'Sort with lambda comparator.',
  },
  {
    label:'binary-search-idx',
    detail:'lower_bound index pattern',
    kind:'snippet',
    insertText:'int ${1:idx} = lower_bound(${2:v}.begin(), ${2:v}.end(), ${3:target}) - ${2:v}.begin();',
    doc:'Find index using lower_bound on sorted array.',
  },
  {
    label:'dfs',
    detail:'DFS recursive template',
    kind:'snippet',
    insertText:'void dfs(int ${1:u}, vector<bool>& visited, vector<vector<int>>& adj) {\n\tvisited[${1:u}] = true;\n\tfor (int ${2:v} : adj[${1:u}]) {\n\t\tif (!visited[${2:v}]) dfs(${2:v}, visited, adj);\n\t}\n}',
    doc:'Depth-first search template.',
  },
  {
    label:'bfs',
    detail:'BFS template',
    kind:'snippet',
    insertText:'vector<int> dist(${1:n}, -1);\nqueue<int> q;\ndist[${2:src}] = 0;\nq.push(${2:src});\nwhile (!q.empty()) {\n\tint ${3:u} = q.front(); q.pop();\n\tfor (int ${4:v} : adj[${3:u}]) {\n\t\tif (dist[${4:v}] == -1) {\n\t\t\tdist[${4:v}] = dist[${3:u}] + 1;\n\t\t\tq.push(${4:v});\n\t\t}\n\t}\n}',
    doc:'Breadth-first search template.',
  },
  {
    label:'dijkstra',
    detail:'Dijkstra shortest path',
    kind:'snippet',
    insertText:'vector<long long> dist(${1:n}, LLONG_MAX);\npriority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;\ndist[${2:src}] = 0;\npq.push({0, ${2:src}});\nwhile (!pq.empty()) {\n\tauto [d, u] = pq.top(); pq.pop();\n\tif (d > dist[u]) continue;\n\tfor (auto [v, w] : adj[u]) {\n\t\tif (dist[u] + w < dist[v]) {\n\t\t\tdist[v] = dist[u] + w;\n\t\t\tpq.push({dist[v], v});\n\t\t}\n\t}\n}',
    doc:'Dijkstra with min-heap. adj[u] = vector of {neighbor, weight}.',
  },
  {
    label:'dp-1d',
    detail:'1D DP array',
    kind:'snippet',
    insertText:'vector<${1:long long}> dp(${2:n}+1, ${3:0});\nfor (int i = 1; i <= ${2:n}; i++) {\n\tdp[i] = ${4:dp[i-1]};\n}',
    doc:'1D dynamic programming template.',
  },
  {
    label:'dp-2d',
    detail:'2D DP array',
    kind:'snippet',
    insertText:'vector<vector<${1:long long}>> dp(${2:n}+1, vector<${1:long long}>(${3:m}+1, ${4:0}));\nfor (int i = 1; i <= ${2:n}; i++) {\n\tfor (int j = 1; j <= ${3:m}; j++) {\n\t\tdp[i][j] = ${5:dp[i-1][j]};\n\t}\n}',
    doc:'2D dynamic programming template.',
  },
  {
    label:'gcd-func',
    detail:'GCD + LCM functions',
    kind:'snippet',
    insertText:'long long gcd(long long a, long long b) { return b ? gcd(b, a%b) : a; }\nlong long lcm(long long a, long long b) { return a / gcd(a, b) * b; }',
    doc:'GCD and LCM helper functions.',
  },
  {
    label:'fast-io',
    detail:'Fast I/O setup',
    kind:'snippet',
    insertText:'ios_base::sync_with_stdio(false);\ncin.tie(NULL);',
    doc:'Disable sync with C I/O for faster cin/cout.',
  },
  {
    label:'mt-rng',
    detail:'Mersenne Twister RNG',
    kind:'snippet',
    insertText:'mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());\nuniform_int_distribution<int> dist(${1:0}, ${2:n}-1);\nint val = dist(rng);',
    doc:'High-quality random number generator.',
  },
];

// ── Parsed structs ─────────────────────────────────────────────────────────
interface UserType {
  name:    string;
  fields:  { name: string; type: string }[];
  methods: string[];
}

function parseUserTypes(code: string): UserType[] {
  const types: UserType[] = [];
  const structRe = /(?:struct|class)\s+(\w+)\s*(?::[^{]*)?\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = structRe.exec(code)) !== null) {
    const typeName = m[1];
    const body     = m[2];
    const fields:  { name: string; type: string }[] = [];
    const methods: string[] = [];
    const fieldRe = /^\s*(?:(?:static|const|mutable|volatile)\s+)?([\w:*&<>,\s]+?)\s+([\w,\s]+)\s*;/gm;
    let fm: RegExpExecArray | null;
    while ((fm = fieldRe.exec(body)) !== null) {
      const type  = fm[1].trim();
      const names = fm[2].split(',').map(n => n.trim()).filter(n => /^\w+$/.test(n));
      for (const name of names) {
        if (name && !['return','if','for','while'].includes(name)) fields.push({ name, type });
      }
    }
    const methodRe = /^\s*(?:(?:static|virtual|inline|const|explicit)\s+)*[\w:*&<>]+\s+(\w+)\s*\(/gm;
    let mm: RegExpExecArray | null;
    while ((mm = methodRe.exec(body)) !== null) {
      const methodName = mm[1];
      if (!['if','for','while','switch'].includes(methodName)) methods.push(methodName);
    }
    types.push({ name: typeName, fields, methods });
  }
  return types;
}

function getVarType(code: string, varName: string): string | null {
  const patterns = [
    new RegExp(`(?:^|[;{}\\n])\\s*(\\w+)\\s+${varName}\\s*[;=({]`, 'gm'),
    new RegExp(`(\\w+<[^>]+>)\\s+${varName}\\s*[;=({]`, 'gm'),
  ];
  for (const re of patterns) {
    const m = re.exec(code);
    if (m) return m[1].trim().replace(/<[^>]*>/, '');
  }
  return null;
}

// ── Parse diagnostics ─────────────────────────────────────────────────────
export interface Diagnostic {
  line:     number;
  col:      number;
  message:  string;
  severity: 'error' | 'warning';
}

export function parseGppDiagnostics(stderr: string): Diagnostic[] {
  const diags: Diagnostic[] = [];
  const re = /^[^:]+:(\d+):(\d+):\s*(error|warning|note):\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stderr)) !== null) {
    if (m[3] === 'note') continue;
    diags.push({ line: parseInt(m[1],10), col: parseInt(m[2],10), message: m[4].trim(), severity: m[3] === 'warning' ? 'warning' : 'error' });
  }
  return diags;
}

// ── Build markdown doc for function with params ───────────────────────────
function buildFunctionDoc(def: SuggestionDef): string {
  let md = def.doc || '';
  if (def.returnType) md = `**Returns:** \`${def.returnType}\`\n\n` + md;
  if (def.params && def.params.length > 0) {
    md += '\n\n**Parameters:**\n';
    for (const p of def.params) {
      md += `- \`${p.name}\` *(${p.type})*: ${p.description}\n`;
    }
  }
  return md;
}

// ── Register everything ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCppSuggestions(monaco: any, options?: { snippets?: boolean }) {
  const enableSnippets = options?.snippets !== false;

  if ((window as any).__cppSuggestionsRegistered) return;
  (window as any).__cppSuggestionsRegistered = true;

  const CIK = monaco.languages.CompletionItemKind;

  const kindMap: Record<string, number> = {
    keyword:  CIK.Keyword,
    function: CIK.Function,
    class:    CIK.Class,
    field:    CIK.Field,
    method:   CIK.Method,
    snippet:  CIK.Snippet,
    variable: CIK.Variable,
  };

  const allBase: SuggestionDef[] = [
    ...KEYWORDS,
    ...STL_TYPES,
    ...STL_FUNCS,
    ...(enableSnippets ? SNIPPETS : []),
  ];

  // ── Completion provider ──────────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider('cpp', {
    triggerCharacters: ['.', '>', ':', '#', '<', '(', '_'],

    provideCompletionItems(model: any, position: any) {
      const fullCode = model.getValue() as string;
      const lineText = model.getLineContent(position.lineNumber) as string;
      const word     = model.getWordUntilPosition(position);
      const query    = word.word;

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber:   position.lineNumber,
        startColumn:     word.startColumn,
        endColumn:       word.endColumn,
      };

      const beforeCursor = lineText.substring(0, position.column - 1);
      const dotMatch     = beforeCursor.match(/(\w+)\s*\.\s*$/);
      const arrowMatch   = beforeCursor.match(/(\w+)\s*->\s*$/);
      const accessVar    = (dotMatch ?? arrowMatch)?.[1];

      // Member access
      if (accessVar) {
        const varType  = getVarType(fullCode, accessVar);
        const userTypes = parseUserTypes(fullCode);
        const memberSuggestions: SuggestionDef[] = [];

        const userType = userTypes.find(t => t.name === varType || t.name === accessVar);
        if (userType) {
          for (const field of userType.fields) {
            memberSuggestions.push({ label: field.name, detail: field.type, insertText: field.name, doc: `${userType.name}::${field.name}: ${field.type}`, kind: 'field' });
          }
          for (const method of userType.methods) {
            memberSuggestions.push({ label: method, detail: 'method', insertText: method, doc: `${userType.name}::${method}()`, kind: 'method' });
          }
        }

        const containerBase = varType ?? accessVar.toLowerCase();
        const methods = CONTAINER_METHOD_DEFS[containerBase] ?? CONTAINER_METHOD_DEFS[accessVar.toLowerCase()] ?? [];
        for (const m of methods) {
          if (!memberSuggestions.find(s => s.label === m.name)) {
            memberSuggestions.push({
              label: m.name, detail: m.detail, insertText: m.name,
              doc: buildFunctionDoc({ label: m.name, detail: m.detail, insertText: m.name, doc: m.doc, params: m.params, returnType: m.returnType }),
              kind: m.params !== undefined && m.params.length >= 0 && m.name !== 'first' && m.name !== 'second' ? 'method' : 'field',
              params: m.params, returnType: m.returnType,
            });
          }
        }

        if (memberSuggestions.length === 0) {
          for (const [typeName, ms] of Object.entries(CONTAINER_METHOD_DEFS)) {
            for (const m of ms) {
              memberSuggestions.push({ label: m.name, detail: `${typeName}::${m.detail}`, insertText: m.name, doc: m.doc, kind: 'method', params: m.params });
            }
          }
        }

        const scored = memberSuggestions
          .map(s => ({ s, score: query ? fuzzyScore(query, s.label) : 1500 }))
          .filter(({ score }) => score >= 0)
          .sort((a, b) => b.score - a.score);

        return {
          suggestions: scored.map(({ s, score }) => ({
            label:         { label: s.label, detail: s.params ? `(${s.params.map(p => p.name).join(', ')})` : '', description: s.detail },
            kind:          kindMap[s.kind ?? 'field'],
            detail:        s.detail,
            documentation: { value: s.doc, isTrusted: true },
            insertText:    s.insertText,
            insertTextRules: s.kind === 'snippet' ? 4 : 0,
            range,
            sortText: String(100000 - score).padStart(6, '0') + s.label,
          })),
        };
      }

      if (!query) return { suggestions: [] };

      const userTypes     = parseUserTypes(fullCode);
      const userTypeSuggs: SuggestionDef[] = userTypes.map(t => ({
        label: t.name, detail: 'user-defined type', insertText: t.name, doc: `struct/class ${t.name}`, kind: 'class' as const,
      }));

      const identifiers = new Set<string>();
      const identRe = /\b([a-zA-Z_]\w{1,30})\b/g;
      let im: RegExpExecArray | null;
      while ((im = identRe.exec(fullCode)) !== null) identifiers.add(im[1]);
      const identSuggs: SuggestionDef[] = [...identifiers]
        .filter(id => !KEYWORDS.find(k => k.label === id) && !STL_TYPES.find(t => t.label === id) && !STL_FUNCS.find(f => f.label === id))
        .map(id => ({ label: id, detail: 'identifier', insertText: id, doc: id, kind: 'variable' as const }));

      const combined = [...allBase, ...userTypeSuggs, ...identSuggs];
      const scored   = combined
        .map(s => ({ s, score: fuzzyScore(query, s.label) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 80);

      return {
        suggestions: scored.map(({ s, score }) => ({
          label: {
            label:       s.label,
            detail:      s.params ? `(${s.params.map(p => p.name).join(', ')})` : '',
            description: s.detail,
          },
          kind:          kindMap[s.kind ?? 'keyword'],
          detail:        s.detail,
          documentation: { value: buildFunctionDoc(s), isTrusted: true },
          insertText:    s.insertText,
          insertTextRules: s.kind === 'snippet' ? 4 : 0,
          range,
          sortText:  String(100000 - score).padStart(6, '0') + s.label,
          preselect: score >= 1800,
        })),
      };
    },
  });

  // ── Signature Help provider ─────────────────────────────────────────────
  const ALL_FUNCS_WITH_SIGS: SuggestionDef[] = [
    ...STL_FUNCS.filter(f => f.params && f.params.length > 0),
    ...Object.values(CONTAINER_METHOD_DEFS).flat().filter(m => m.params && m.params.length > 0).map(m => ({
      label:      m.name,
      detail:     m.detail,
      insertText: m.name,
      doc:        m.doc,
      params:     m.params,
      returnType: m.returnType,
    })),
  ];

  monaco.languages.registerSignatureHelpProvider('cpp', {
    signatureHelpTriggerCharacters:     ['(', ','],
    signatureHelpRetriggerCharacters:   [','],

    provideSignatureHelp(model: any, position: any) {
      const lineText = model.getLineContent(position.lineNumber) as string;
      const before   = lineText.substring(0, position.column - 1);

      // Find function name before the open paren
      const fnMatch = before.match(/(\w+)\s*\([^)]*$/);
      if (!fnMatch) return null;
      const fnName = fnMatch[1];

      // Count commas to find active parameter
      const afterParen  = before.substring(before.lastIndexOf('(') + 1);
      let depth         = 0;
      let activeParam   = 0;
      for (const ch of afterParen) {
        if (ch === '(' || ch === '[' || ch === '{') depth++;
        else if (ch === ')' || ch === ']' || ch === '}') depth--;
        else if (ch === ',' && depth === 0) activeParam++;
      }

      // Match against known functions
      const matches = ALL_FUNCS_WITH_SIGS.filter(f => f.label === fnName && f.params && f.params.length > 0);
      if (matches.length === 0) return null;

      const signatures = matches.map(fn => {
        const paramList = fn.params!;
        return {
          label: `${fn.returnType ? fn.returnType + ' ' : ''}${fn.label}(${paramList.map(p => `${p.type} ${p.name}`).join(', ')})`,
          documentation: { value: fn.doc || fn.detail, isTrusted: true },
          parameters: paramList.map(p => ({
            label: `${p.type} ${p.name}`,
            documentation: { value: p.description },
          })),
        };
      });

      return {
        value: {
          signatures,
          activeSignature: 0,
          activeParameter: Math.min(activeParam, (matches[0].params?.length ?? 1) - 1),
        },
        dispose: () => {},
      };
    },
  });

  // Also register for C language
  monaco.languages.registerCompletionItemProvider('c', {
    triggerCharacters: ['.', '>', '#'],
    provideCompletionItems(model: any, position: any) {
      const word  = model.getWordUntilPosition(position);
      const query = word.word;
      if (!query) return { suggestions: [] };
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };

      const cKeywords = ['int','long','short','char','float','double','void','unsigned','signed','const','static','extern','inline','struct','union','enum','typedef','return','if','else','for','while','do','switch','case','default','break','continue','goto','sizeof','NULL','printf','scanf','malloc','free','memset','memcpy','strlen','strcpy','strcmp'];
      const scored = cKeywords
        .map(k => ({ k, score: fuzzyScore(query, k) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => b.score - a.score);
      return {
        suggestions: scored.map(({ k, score }) => ({
          label: k, kind: CIK.Keyword, detail: 'C keyword',
          documentation: { value: `C keyword: ${k}` },
          insertText: k, range,
          sortText: String(100000 - score).padStart(6, '0') + k,
        })),
      };
    },
  });
}

// ── Diagnostics helpers ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyDiagnosticsToMonaco(monaco: any, editor: any, diagnostics: Diagnostic[]) {
  const model = editor.getModel();
  if (!model) return;
  const markers = diagnostics.map(d => ({
    severity:        d.severity === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
    message:         d.message,
    startLineNumber: d.line, startColumn: d.col,
    endLineNumber:   d.line, endColumn: Math.min(d.col + 80, model.getLineMaxColumn(d.line)),
    source: 'g++',
  }));
  monaco.editor.setModelMarkers(model, 'cppeditor', markers);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clearDiagnostics(monaco: any, editor: any) {
  const model = editor.getModel();
  if (!model) return;
  monaco.editor.setModelMarkers(model, 'cppeditor', []);
}
