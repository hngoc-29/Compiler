'use client';

/**
 * components/CodeEditor.tsx
 * Monaco Editor wrapper cho C++ – dynamic import để tránh SSR.
 */

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { Loader2 } from 'lucide-react';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-bg-base">
        <Loader2 size={22} className="animate-spin text-indigo-400" />
      </div>
    ),
  }
);

interface CodeEditorProps {
  value:    string;
  onChange: (value: string | undefined) => void;
  onRun:    () => void;
  readOnly?: boolean;
}

export default function CodeEditor({ value, onChange, onRun, readOnly = false }: CodeEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Ctrl/Cmd + Enter → Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);

    editor.focus();
  };

  return (
    <MonacoEditor
      height="100%"
      language="cpp"
      theme="vs-dark"
      value={value}
      onChange={onChange}
      onMount={handleMount}
      options={{
        fontFamily:          "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        fontSize:            13,
        fontLigatures:       true,
        lineHeight:          22,
        minimap:             { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap:            'off',
        tabSize:             4,
        insertSpaces:        true,
        readOnly,
        folding:             true,
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes:   'always',
        suggestOnTriggerCharacters: true,
        smoothScrolling:     true,
        cursorBlinking:      'smooth',
        cursorSmoothCaretAnimation: 'on',
        padding:             { top: 10, bottom: 10 },
        lineNumbers:         'on',
        lineDecorationsWidth: 6,
        lineNumbersMinChars: 3,
        renderWhitespace:    'selection',
        overviewRulerLanes:  0,
        hideCursorInOverviewRuler: true,
        scrollbar: {
          verticalScrollbarSize:   6,
          horizontalScrollbarSize: 6,
        },
      }}
    />
  );
}
