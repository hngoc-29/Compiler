'use client';

/**
 * components/CodeEditor.tsx
 *
 * Fixes so với bản cũ:
 *   1. Mobile keyboard: visualViewport API để resize editor.
 *   2. C++ suggestions: fuzzy matching + full STL/keyword database.
 *   3. Mobile selection: long-press → select word, drag → extend selection.
 *   4. Mobile replace: gõ phím khi đang bôi đen sẽ xóa vùng chọn trước.
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

// ── Helper: kiểm tra thiết bị cảm ứng ───────────────────────────────────
const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

// ── Fix 3 + 4: Mobile touch selection & replace-on-type ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setupMobileInteractions(editor: any) {
  if (!isTouchDevice()) return;

  const domNode: HTMLElement | null = editor.getDomNode();
  if (!domNode) return;

  // ── Fix 4: Gõ phím thay thế vùng bôi đen ──────────────────────────
  // Monaco dùng hidden <textarea> để nhận input từ bàn phím ảo.
  // Intercept beforeinput TRƯỚC khi Monaco xử lý để xóa selection trước.
  const textarea = domNode.querySelector('textarea');
  if (textarea) {
    textarea.addEventListener(
      'beforeinput',
      (e: Event) => {
        const ie = e as InputEvent;
        // Chỉ xử lý khi người dùng gõ ký tự mới (không phải xóa / IME)
        if (ie.inputType !== 'insertText' || !ie.data) return;

        const sel = editor.getSelection();
        if (!sel || sel.isEmpty()) return;

        // Xóa vùng selection → Monaco sẽ insert ký tự tại vị trí mới
        editor.executeEdits('mobile-replace', [{ range: sel, text: '' }]);
      },
      true // capture phase: chạy trước handler của Monaco
    );

    // Fix: Backspace/Delete trên mobile cũng cần xóa vùng chọn (không chỉ 1 ký tự)
    textarea.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (e.key !== 'Backspace' && e.key !== 'Delete') return;
        const sel = editor.getSelection();
        if (!sel || sel.isEmpty()) return;
        e.preventDefault();
        editor.executeEdits('mobile-delete', [{ range: sel, text: '' }]);
      },
      true
    );
  }

  // ── Fix 3: Long-press → bôi đen từ, kéo → mở rộng selection ──────────
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let isSelectMode  = false;
  let anchorPos: { lineNumber: number; column: number } | null = null;

  // Chuyển tọa độ màn hình → vị trí buffer Monaco
  const clientToPosition = (cx: number, cy: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = (editor as any).getTargetAtClientPoint(cx, cy);
    return target?.position ?? null;
  };

  const cancelLongPress = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  };

  domNode.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      isSelectMode = false;
      anchorPos    = null;
      cancelLongPress();

      const touch = e.touches[0];
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        const pos = clientToPosition(touch.clientX, touch.clientY);
        if (!pos) return;

        // Bôi đen từ tại vị trí long-press
        const model = editor.getModel();
        const word  = model?.getWordAtPosition(pos);
        if (word) {
          anchorPos = { lineNumber: pos.lineNumber, column: word.startColumn };
          editor.setSelection({
            startLineNumber: pos.lineNumber,
            startColumn:     word.startColumn,
            endLineNumber:   pos.lineNumber,
            endColumn:       word.endColumn,
          });
        } else {
          anchorPos = { lineNumber: pos.lineNumber, column: pos.column };
          editor.setPosition(pos);
        }

        isSelectMode = true;
        // Rung nhẹ xác nhận long-press (nếu browser hỗ trợ)
        if (navigator.vibrate) navigator.vibrate(30);
      }, 480);
    },
    { passive: true }
  );

  domNode.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      // Nếu chưa vào select mode, huỷ long-press (người dùng đang scroll)
      if (!isSelectMode) {
        cancelLongPress();
        return;
      }

      // Đang kéo để mở rộng selection → chặn scroll trang
      e.preventDefault();

      const touch  = e.touches[0];
      const endPos = clientToPosition(touch.clientX, touch.clientY);
      if (!endPos || !anchorPos) return;

      // Xác định hướng kéo và set selection
      const before =
        endPos.lineNumber < anchorPos.lineNumber ||
        (endPos.lineNumber === anchorPos.lineNumber &&
          endPos.column < anchorPos.column);

      editor.setSelection(
        before
          ? {
              startLineNumber: endPos.lineNumber,
              startColumn:     endPos.column,
              endLineNumber:   anchorPos.lineNumber,
              endColumn:       anchorPos.column,
            }
          : {
              startLineNumber: anchorPos.lineNumber,
              startColumn:     anchorPos.column,
              endLineNumber:   endPos.lineNumber,
              endColumn:       endPos.column,
            }
      );

      // Auto-scroll khi kéo gần mép trên/dưới
      const rect    = domNode.getBoundingClientRect();
      const relY    = touch.clientY - rect.top;
      const scrollBy = relY < 60 ? -40 : relY > rect.height - 60 ? 40 : 0;
      if (scrollBy) editor.setScrollTop(editor.getScrollTop() + scrollBy);
    },
    { passive: false }
  );

  const endSelect = () => {
    cancelLongPress();
    isSelectMode = false;
    anchorPos    = null;
  };
  domNode.addEventListener('touchend',    endSelect, { passive: true });
  domNode.addEventListener('touchcancel', endSelect, { passive: true });
}

export default function CodeEditor({ value, onChange, onRun, readOnly = false }: CodeEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef    = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fix 1: Mobile virtual keyboard resize ───────────────────────────────
  useEffect(() => {
    const vv = (typeof window !== 'undefined') ? window.visualViewport : null;
    if (!vv) return;

    let rafId = 0;

    const onViewportChange = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const rect      = container.getBoundingClientRect();
        const visibleBot = vv.offsetTop + vv.height;
        const editorTop  = rect.top + vv.offsetTop;
        const available  = visibleBot - editorTop - 4;

        if (available > 60) container.style.height = `${available}px`;

        const editor = editorRef.current;
        if (editor) {
          editor.layout();
          const pos = editor.getPosition();
          if (pos) editor.revealLineInCenter(pos.lineNumber);
        }
      });
    };

    const onViewportClose = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (container) container.style.height = '';
        editorRef.current?.layout();
      });
    };

    const checkClose = () => {
      if (vv.height > window.innerHeight * 0.8) onViewportClose();
    };

    vv.addEventListener('resize', onViewportChange);
    vv.addEventListener('scroll', onViewportChange);
    vv.addEventListener('resize', checkClose);

    return () => {
      vv.removeEventListener('resize', onViewportChange);
      vv.removeEventListener('scroll', onViewportChange);
      vv.removeEventListener('resize', checkClose);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // ── Fix 2: C++ suggestions + Fix 3+4: Mobile interactions ───────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMount = async (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Ctrl/Cmd + Enter → Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);

    // Đăng ký C++ completion provider (lazy import)
    const { registerCppSuggestions } = await import('@/lib/cpp-suggestions');
    registerCppSuggestions(monaco);

    // Mobile interactions (selection + replace)
    setupMobileInteractions(editor);

    // Focus sau một tick để tránh layout shift
    setTimeout(() => editor.focus(), 50);

    // Cursor tracking khi bàn phím ảo mở
    editor.onDidChangeCursorPosition(() => {
      const vv = window.visualViewport;
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
          parameterHints: { enabled: true },
          suggest: {
            snippetsPreventQuickSuggestions: false,
            showSnippets:     true,
            showKeywords:     true,
            showFunctions:    true,
            showVariables:    true,
            showClasses:      true,
            showStructs:      true,
            filterGraceful:   true,
            // Hiện suggest ngay từ ký tự đầu tiên
            localityBonus:    true,
          },
          acceptSuggestionOnEnter: 'smart',

          smoothScrolling:            true,
          cursorBlinking:             'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding:                    { top: 10, bottom: 80 },
          lineNumbers:                'on',
          lineDecorationsWidth:       6,
          lineNumbersMinChars:        3,
          renderWhitespace:           'selection',
          overviewRulerLanes:         0,
          hideCursorInOverviewRuler:  true,
          scrollbar: {
            verticalScrollbarSize:   6,
            horizontalScrollbarSize: 6,
            alwaysConsumeMouseWheel: false,
          },

          // Mobile: tăng touch target
          cursorWidth: 2,
          mouseWheelScrollSensitivity: 1.5,
        }}
      />
    </div>
  );
}
