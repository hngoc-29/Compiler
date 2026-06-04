/**
 * lib/languages.ts
 * Định nghĩa các ngôn ngữ và version hỗ trợ.
 */

export interface LangVersion {
  id:       string;   // dùng làm key
  label:    string;   // hiển thị trong dropdown
  lang:     string;   // 'cpp' | 'python' | 'c' | 'java'
  monacoLang: string; // language id cho Monaco
  compiler: string;   // 'g++' | 'python3' | 'gcc' | 'java'
  args:     string[]; // compile/run args
  ext:      string;   // file extension
  hello:    string;   // default Hello World code
}

export const LANG_VERSIONS: LangVersion[] = [
  {
    id: 'cpp20', label: 'C++20', lang: 'cpp', monacoLang: 'cpp',
    compiler: 'g++', args: ['-std=c++20', '-Wall', '-Wextra'],
    ext: 'cpp',
    hello: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  },
  {
    id: 'cpp17', label: 'C++17', lang: 'cpp', monacoLang: 'cpp',
    compiler: 'g++', args: ['-std=c++17', '-Wall', '-Wextra'],
    ext: 'cpp',
    hello: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  },
  {
    id: 'cpp14', label: 'C++14', lang: 'cpp', monacoLang: 'cpp',
    compiler: 'g++', args: ['-std=c++14', '-Wall', '-Wextra'],
    ext: 'cpp',
    hello: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  },
  {
    id: 'cpp11', label: 'C++11', lang: 'cpp', monacoLang: 'cpp',
    compiler: 'g++', args: ['-std=c++11', '-Wall', '-Wextra'],
    ext: 'cpp',
    hello: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  },
  {
    id: 'c11', label: 'C11', lang: 'c', monacoLang: 'c',
    compiler: 'gcc', args: ['-std=c11', '-Wall', '-Wextra', '-lm'],
    ext: 'c',
    hello: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
  },
  {
    id: 'python3', label: 'Python 3', lang: 'python', monacoLang: 'python',
    compiler: 'python3', args: [],
    ext: 'py',
    hello: `# Python 3\nimport sys\ninput = sys.stdin.readline\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
  },
];

export const DEFAULT_LANG_ID = 'cpp20';

export function getLangById(id: string): LangVersion {
  return LANG_VERSIONS.find(l => l.id === id) ?? LANG_VERSIONS[0];
}
