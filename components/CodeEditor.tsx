'use client';

/**
 * components/CodeEditor.tsx
 *
 * Fixes so với bản cũ:
 *   1. Mobile keyboard: dùng visualViewport API để resize editor khi bàn phím ảo mở,
 *      tránh bị che. Cursor luôn được scroll vào vùng nhìn thấy.
 *   2. C++ suggestions: đăng ký completion provider với snippets, STL, CP templates.
 */

import dynamic from 'next/dynamic';
import { useRef, useEffect } from 'react';
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
  value:     string;
  onChange:  (value: string | undefined) => void;
  onRun:     () => void;
  readOnly?: boolean;
}

export default function CodeEditor({ value, onChange, onRun, readOnly = false }: CodeEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef    = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fix 1: Mobile virtual keyboard ──────────────────────────────────────
  // Khi bàn phím ảo bật lên, visualViewport.height giảm.
  // Ta resize container để editor vừa vùng nhìn thấy, rồi reveal cursor.
  useEffect(() => {
    const vv = (typeof window !== 'undefined') ? window.visualViewport : null;
    if (!vv) return;

    let rafId = 0;

    const onViewportChange = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const rect        = container.getBoundingClientRect();
        const visibleTop  = vv.offsetTop;               // scroll của viewport
        const visibleBot  = vv.offsetTop + vv.height;   // đáy viewport nhìn thấy
        const editorTop   = rect.top + visibleTop;      // vị trí editor so với trang
        const available   = visibleBot - editorTop - 4; // chiều cao khả dụng (4px buffer)

        if (available > 60) {
          container.style.height = `${available}px`;
        }

        // Scroll Monaco để cursor luôn hiện trong vùng nhìn thấy
        const editor = editorRef.current;
        if (editor) {
          editor.layout();
          const pos = editor.getPosition();
          if (pos) editor.revealLineInCenter(pos.lineNumber);
        }
      });
    };

    // Khi bàn phím đóng, trả về height 100% (flex parent kiểm soát)
    const onViewportClose = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (container) container.style.height = '';
        editorRef.current?.layout();
      });
    };

    vv.addEventListener('resize',  onViewportChange);
    vv.addEventListener('scroll',  onViewportChange);
    // Khi keyboard đóng, visualViewport height về lại gần window.innerHeight
    const checkClose = () => {
      if (vv.height > window.innerHeight * 0.8) onViewportClose();
    };
    vv.addEventListener('resize', checkClose);

    return () => {
      vv.removeEventListener('resize',  onViewportChange);
      vv.removeEventListener('scroll',  onViewportChange);
      vv.removeEventListener('resize',  checkClose);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // ── Fix 2: C++ suggestions + editor setup ───────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMount = async (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Ctrl/Cmd + Enter → Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);

    // Đăng ký C++ completion provider (lazy import)
    const { registerCppSuggestions } = await import('@/lib/cpp-suggestions');
    registerCppSuggestions(monaco);

    // Trên mobile: focus sau một tick để tránh layout shift
    setTimeout(() => editor.focus(), 50);

    // Khi cursor di chuyển (người dùng gõ), scroll vào vùng nhìn thấy
    editor.onDidChangeCursorPosition(() => {
      const vv = window.visualViewport;
      // Chỉ can thiệp nếu keyboard đang mở (viewport thu hẹp đáng kể)
      if (vv && vv.height < window.innerHeight * 0.75) {
        const pos = editor.getPosition();
        if (pos) editor.revealLineNearTop(pos.lineNumber);
      }
    });
  };

  return (
    <div ref={containerRef} style={{ height: '100%', overflow: 'hidden' }}>
      <MonacoEditor
        height="100%"
        language="cpp"
        theme="vs-dark"
        value={value}
        onChange={onChange}
        onMount={handleMount}
        options={{
          fontFamily:           "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontSize:             13,
          fontLigatures:        true,
          lineHeight:           22,
          minimap:              { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap:             'off',
          tabSize:              4,
          insertSpaces:         true,
          readOnly,
          folding:              true,
          bracketPairColorization: { enabled: true },
          autoClosingBrackets:  'always',
          autoClosingQuotes:    'always',

          // ── Suggestions ──
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other:    true,
            comments: false,
            strings:  false,
          },
          parameterHints:   { enabled: true },
          suggest: {
            snippetsPreventQuickSuggestions: false,
            showSnippets:     true,
            showKeywords:     true,
            showFunctions:    true,
            showVariables:    true,
            showClasses:      true,
            showStructs:      true,
            filterGraceful:   true,
          },
          acceptSuggestionOnEnter: 'smart',

          smoothScrolling:           true,
          cursorBlinking:            'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding:                   { top: 10, bottom: 80 }, // bottom padding cho mobile keyboard
          lineNumbers:               'on',
          lineDecorationsWidth:      6,
          lineNumbersMinChars:       3,
          renderWhitespace:          'selection',
          overviewRulerLanes:        0,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            verticalScrollbarSize:   6,
            horizontalScrollbarSize: 6,
            alwaysConsumeMouseWheel: false, // quan trọng: cho phép page scroll trên mobile
          },

          // Mobile: tăng kích thước cursor và touch target
          cursorWidth: 2,
          mouseWheelScrollSensitivity: 1.5,
        }}
      />
    </div>
  );
}
