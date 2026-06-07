/**
 * lib/user-fn-hints.ts
 * Parse hàm tự định nghĩa trong code của người dùng và đăng ký
 * completion + signatureHelp provider với Monaco.
 *
 * Hỗ trợ: C++ và Python.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Monaco = any;

// ── Parsers ──────────────────────────────────────────────────────────────────

export interface UserFn {
  name:       string;
  params:     string[];   // mỗi phần tử là "type name" hoặc chỉ "name" (Python)
  returnType: string;
}

const CPP_KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'do', 'else', 'return',
  'case', 'default', 'namespace', 'class', 'struct', 'enum', 'union',
  'try', 'throw', 'new', 'delete',
]);

/**
 * Parse function / method definitions từ C++ code.
 * Nhận diện: `returnType funcName(params) { ... }`
 */
export function parseCppFunctions(code: string): UserFn[] {
  const results: UserFn[] = [];
  // returnType name(params)  optionally: const, override, noexcept ...  then { or ;
  const regex =
    /^[ \t]*((?:(?:inline|static|virtual|constexpr|explicit|friend|auto)\s+)*(?:[\w:<>*&\[\]]+(?:\s*[*&\s]+)?))\s*(~?[\w]+)\s*\(([^)]*)\)\s*(?:const\s*)?(?:override\s*)?(?:noexcept[^{;]*)?\s*[{;]/gm;

  let m: RegExpExecArray | null;
  while ((m = regex.exec(code)) !== null) {
    const returnType = m[1].trim().replace(/\s+/g, ' ');
    const name       = m[2].trim();
    const paramsRaw  = m[3].trim();

    if (CPP_KEYWORDS.has(name)) continue;
    if (name.startsWith('~')) continue;           // destructor
    if (/^[A-Z]/.test(name) && !paramsRaw) continue; // likely macro

    const params = paramsRaw
      ? paramsRaw.split(',').map(p => p.trim().replace(/\s+/g, ' ')).filter(Boolean)
      : [];

    // Avoid duplicates by name+param count
    if (!results.find(f => f.name === name && f.params.length === params.length)) {
      results.push({ name, params, returnType });
    }
  }
  return results;
}

/**
 * Parse function definitions từ Python code.
 * Nhận diện: `def funcName(params):`
 */
export function parsePythonFunctions(code: string): UserFn[] {
  const results: UserFn[] = [];
  const regex = /^def\s+([\w]+)\s*\(([^)]*)\)\s*(?:->[^:]+)?:/gm;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(code)) !== null) {
    const name      = m[1];
    const paramsRaw = m[2].trim();
    const params    = paramsRaw
      ? paramsRaw.split(',').map(p => p.split('=')[0].trim()).filter(Boolean)
      : [];
    if (!results.find(f => f.name === name)) {
      results.push({ name, params, returnType: '' });
    }
  }
  return results;
}

function parseForLang(code: string, lang: string): UserFn[] {
  return lang === 'python' ? parsePythonFunctions(code) : parseCppFunctions(code);
}

// ── Active call detection ─────────────────────────────────────────────────────

interface ActiveCall { name: string; activeParam: number; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActiveCall(model: any, position: any): ActiveCall | null {
  const offset = model.getOffsetAt(position);
  const text   = model.getValue().substring(0, offset);

  let depth  = 0;
  let commas = 0;

  for (let i = text.length - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === ')' || ch === ']') { depth++; continue; }
    if (ch === ']')  { depth++; continue; }
    if (ch === '(' ) {
      if (depth === 0) {
        const before    = text.substring(0, i);
        const nameMatch = /(\w+)\s*$/.exec(before);
        if (!nameMatch) return null;
        return { name: nameMatch[1], activeParam: commas };
      }
      depth--;
      commas = 0;
    } else if (ch === '[') {
      if (depth > 0) depth--;
    } else if (ch === ',' && depth === 0) {
      commas++;
    } else if ((ch === ';' || ch === '{' || ch === '}') && depth === 0) {
      return null;
    }
  }
  return null;
}

// ── Monaco Provider Registration ─────────────────────────────────────────────

const _registeredUserFnLangs = new Set<string>();

export function registerUserFnProviders(monaco: Monaco, language: string): void {
  if (_registeredUserFnLangs.has(language)) return;
  _registeredUserFnLangs.add(language);

  // ── Completion provider ──────────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider(language, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provideCompletionItems(model: any, position: any) {
      const code = model.getValue();
      const fns  = parseForLang(code, language);
      if (fns.length === 0) return { suggestions: [] };

      const word  = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber:   position.lineNumber,
        startColumn:     word.startColumn,
        endColumn:       word.endColumn,
      };

      const suggestions = fns.map(fn => {
        const paramSnippet = fn.params
          .map((p, i) => {
            // Take last word of "type name" as placeholder
            const placeholder = p.split(/\s+/).pop() || p;
            return `\${${i + 1}:${placeholder}}`;
          })
          .join(', ');

        const label = language === 'python'
          ? `def ${fn.name}(${fn.params.join(', ')})`
          : `${fn.returnType} ${fn.name}(${fn.params.join(', ')})`;

        return {
          label: fn.name,
          kind:  monaco.languages.CompletionItemKind.Function,
          detail: language === 'python' ? '(hàm tự định nghĩa)' : `${fn.returnType} — hàm tự định nghĩa`,
          documentation: { value: `\`\`\`\n${label}\n\`\`\`` },
          insertText: fn.params.length > 0
            ? `${fn.name}(${paramSnippet})`
            : `${fn.name}()$0`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          sortText: `!${fn.name}`,  // '!' < 'a' → hiện lên đầu
          range,
        };
      });

      return { suggestions };
    },
  });

  // ── Signature help provider ──────────────────────────────────────────────
  monaco.languages.registerSignatureHelpProvider(language, {
    signatureHelpTriggerCharacters: ['(', ','],
    signatureHelpRetriggerCharacters: [','],

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provideSignatureHelp(model: any, position: any) {
      const code = model.getValue();
      const fns  = parseForLang(code, language);

      const call = getActiveCall(model, position);
      if (!call) return null;

      const fn = fns.find(f => f.name === call.name);
      if (!fn || fn.params.length === 0) return null;

      // Build full signature label
      const signLabel = language === 'python'
        ? `def ${fn.name}(${fn.params.join(', ')})`
        : `${fn.returnType} ${fn.name}(${fn.params.join(', ')})`;

      // Compute [start, end] byte offsets for each param inside signLabel
      const openParen = signLabel.indexOf('(') + 1;
      let cursor = openParen;
      const paramLabels: [number, number][] = fn.params.map((p, i) => {
        const start = cursor;
        const end   = start + p.length;
        cursor = end + (i < fn.params.length - 1 ? 2 : 0); // +2 for ", "
        return [start, end];
      });

      return {
        value: {
          signatures: [{
            label:      signLabel,
            documentation: {
              value: language === 'python'
                ? `Hàm tự định nghĩa · Python`
                : `Hàm tự định nghĩa · ${fn.returnType}`,
            },
            parameters: fn.params.map((p, i) => ({
              label:         paramLabels[i],
              documentation: p,
            })),
          }],
          activeSignature: 0,
          activeParameter: Math.min(call.activeParam, fn.params.length - 1),
        },
        dispose: () => {},
      };
    },
  });
}
