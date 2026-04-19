'use client';

/**
 * components/CodeEditor.tsx
 * v3 – Sửa mobile selection + thêm nút Undo/Redo
 */

import dynamic from 'next/dynamic';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, Undo2, Redo2 } from 'lucide-react';

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

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

// ── Mobile: bôi đen + gõ thay thế ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setupMobileInteractions(editor: any) {
  if (!isTouchDevice()) return;

  const domNode: HTMLElement | null = editor.getDomNode();
  if (!domNode) return;

  // ─── Lưu selection khi editor blur (bàn phím ảo mở) ───────────────────
  // Monaco có thể mất selection khi focus chuyển sang bàn phím ảo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let savedSelection: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let latestSelection: any = null;

  editor.onDidChangeCursorSelection((e: any) => {
    latestSelection = e.selection;
    if (!e.selection.isEmpty()) {
      savedSelection = e.selection; // lưu selection không rỗng gần nhất
    }
  });

  // Khi editor mất focus (bàn phím ảo mở), khôi phục selection
  editor.onDidBlurEditorWidget(() => {
    // giữ latestSelection để dùng khi refocus
  });

  editor.onDidFocusEditorWidget(() => {
    // Nếu có selection đã lưu và hiện tại rỗng → khôi phục
    setTimeout(() => {
      const cur = editor.getSelection();
      if (savedSelection && cur && cur.isEmpty() && !savedSelection.isEmpty()) {
        editor.setSelection(savedSelection);
      }
    }, 50);
  });

  // ─── Gõ phím thay thế vùng bôi đen ────────────────────────────────────
  // Dùng cả beforeinput (capture) + input (fallback) cho đa dạng browser.
  const textarea = domNode.querySelector('textarea');
  if (textarea) {

    // Phương án 1: beforeinput – chạy trước Monaco, đáng tin cậy nhất
    textarea.addEventListener(
      'beforeinput',
      (e: Event) => {
        const ie = e as InputEvent;
        if (ie.inputType !== 'insertText' || !ie.data) return;

        // Ưu tiên selection hiện tại, fallback về selection đã lưu
        const sel = (latestSelection && !latestSelection.isEmpty())
          ? latestSelection
          : (savedSelection && !savedSelection.isEmpty() ? savedSelection : null);

        if (!sel) return;

        // Xóa selection, Monaco sẽ insert ký tự tại cursor mới
        editor.executeEdits('mobile-replace', [{ range: sel, text: '' }]);
        editor.setPosition({ lineNumber: sel.startLineNumber, column: sel.startColumn });

        // Clear saved selection sau khi replace
        savedSelection  = null;
        latestSelection = null;
      },
      true // capture – chạy trước Monaco
    );

    // Phương án 2: keydown – xử lý Backspace/Delete khi có selection
    textarea.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (e.key !== 'Backspace' && e.key !== 'Delete') return;
        const sel = editor.getSelection();
        if (!sel || sel.isEmpty()) return;
        e.preventDefault();
        editor.executeEdits('mobile-delete', [{ range: sel, text: '' }]);
        savedSelection  = null;
        latestSelection = null;
      },
      true
    );
  }

  // ─── Long-press → chọn từ; kéo → mở rộng selection ───────────────────
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let isSelectMode  = false;
  let anchorPos: { lineNumber: number; column: number } | null = null;

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

        const model = editor.getModel();
        const word  = model?.getWordAtPosition(pos);
        if (word) {
          anchorPos = { lineNumber: pos.lineNumber, column: word.startColumn };
          editor.setSelection({
            startLineNumber: pos.lineNumber,  startColumn: word.startColumn,
            endLineNumber:   pos.lineNumber,  endColumn:   word.endColumn,
          });
        } else {
          anchorPos = { lineNumber: pos.lineNumber, column: pos.column };
          editor.setPosition(pos);
        }
        isSelectMode = true;
        if (navigator.vibrate) navigator.vibrate(30);
      }, 480);
    },
    { passive: true }
  );

  domNode.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (!isSelectMode) { cancelLongPress(); return; }
      e.preventDefault();

      const touch  = e.touches[0];
      const endPos = clientToPosition(touch.clientX, touch.clientY);
      if (!endPos || !anchorPos) return;

      const before =
        endPos.lineNumber < anchorPos.lineNumber ||
        (endPos.lineNumber === anchorPos.lineNumber && endPos.column < anchorPos.column);

      editor.setSelection(
        before
          ? { startLineNumber: endPos.lineNumber, startColumn: endPos.column,
              endLineNumber: anchorPos.lineNumber, endColumn: anchorPos.column }
          : { startLineNumber: anchorPos.lineNumber, startColumn: anchorPos.column,
              endLineNumber: endPos.lineNumber, endColumn: endPos.column }
      );

      // Auto-scroll khi kéo sát mép
      const rect     = domNode.getBoundingClientRect();
      const relY     = touch.clientY - rect.top;
      const scrollBy = relY < 60 ? -40 : relY > rect.height - 60 ? 40 : 0;
      if (scrollBy) editor.setScrollTop(editor.getScrollTop() + scrollBy);
    },
    { passive: false }
  );

  const endSelect = () => { cancelLongPress(); isSelectMode = false; anchorPos = null; };
  domNode.addEventListener('touchend',    endSelect, { passive: true });
  domNode.addEventListener('touchcancel', endSelect, { passive: true });
}

// ─────────────────────────────────────────────────────────────────────────
export default function CodeEditor({ value, onChange, onRun, readOnly = false }: CodeEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef    = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Undo / Redo state (để enable/disable nút) ────────────────────────
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const handleUndo = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'undo', null);
    editorRef.current?.focus();
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'redo', null);
    editorRef.current?.focus();
  }, []);

  // ── Fix 1: Monaco cần layout() tường minh khi container đổi kích thước ──
  // KHÔNG set container.style.height thủ công — EditorLayout đã xử lý
  // viewH = vv.height để co/restore outer container.
  // CodeEditor chỉ cần báo Monaco redraw khi kích thước thay đổi.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;

    const relayout = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        editorRef.current?.layout();
      });
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', relayout);
      vv.addEventListener('scroll', relayout);
    }
    window.addEventListener('resize', relayout);

    return () => {
      cancelAnimationFrame(rafId);
      if (vv) {
        vv.removeEventListener('resize', relayout);
        vv.removeEventListener('scroll', relayout);
      }
      window.removeEventListener('resize', relayout);
    };
  }, []);

  // ── handleMount ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMount = async (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Ctrl/Cmd + Enter → Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);

    // Suggestions
    const { registerCppSuggestions } = await import('@/lib/cpp-suggestions');
    registerCppSuggestions(monaco);

    // Mobile interactions
    setupMobileInteractions(editor);

    // ── Theo dõi trạng thái Undo/Redo ──────────────────────────────────
    const updateUndoRedo = () => {
      const model = editor.getModel();
      if (!model) return;
      // Monaco không expose trực tiếp canUndo/canRedo qua API public,
      // nhưng ta có thể dùng canUndo() từ model nếu có, hoặc track qua history.
      // Fallback: luôn enable nếu model có nội dung.
      const hasContent = (model.getValue() || '').length > 0;
      setCanUndo(hasContent);
      setCanRedo(false); // redo chỉ có sau khi undo
    };

    editor.onDidChangeModelContent(() => {
      updateUndoRedo();
      setCanUndo(true);
      // Sau mỗi thay đổi, redo không khả dụng cho đến khi undo
      setCanRedo(false);
    });

    // Khi undo xảy ra → redo khả dụng
    editor.onDidChangeModelContent(() => updateUndoRedo());

    // Dùng action để biết undo/redo có available không
    // Monaco v0.34+ có editor.getModel()?._undoRedoService
    const trackUndoRedo = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const service = (editor as any)._modelData?.model?._undoRedoService;
        if (service) {
          const stack = service.getElements(editor.getModel()?.uri);
          setCanUndo((stack?.past?.length ?? 0) > 0);
          setCanRedo((stack?.future?.length ?? 0) > 0);
        }
      } catch {
        // fallback: luôn enable
        setCanUndo(true);
        setCanRedo(true);
      }
    };

    editor.onDidChangeModelContent(trackUndoRedo);
    // Cũng track khi cursor move (sau undo/redo cursor thay đổi)
    editor.onDidChangeCursorPosition(trackUndoRedo);

    setTimeout(() => editor.focus(), 50);

    // Cursor tracking khi keyboard ảo mở
    editor.onDidChangeCursorPosition(() => {
      const vv = window.visualViewport;
      if (vv && vv.height < window.innerHeight * 0.75) {
        const pos = editor.getPosition();
        if (pos) editor.revealLineNearTop(pos.lineNumber);
      }
    });
  };

  return (
    <div ref={containerRef} style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* ── Nút Undo / Redo overlay ─────────────────────────────────────── */}
      {!readOnly && (
        <div
          style={{
            position:  'absolute',
            top:       6,
            right:     10,
            zIndex:    10,
            display:   'flex',
            gap:       4,
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           30,
              height:          26,
              background:      canUndo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border:          '1px solid rgba(255,255,255,0.12)',
              borderRadius:    6,
              color:           canUndo ? '#c9d1d9' : '#484f58',
              cursor:          canUndo ? 'pointer' : 'not-allowed',
              transition:      'background 0.15s',
            }}
            onMouseEnter={e => { if (canUndo) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = canUndo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'; }}
          >
            <Undo2 size={14} />
          </button>

          <button
            onClick={handleRedo}
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           30,
              height:          26,
              background:      canRedo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border:          '1px solid rgba(255,255,255,0.12)',
              borderRadius:    6,
              color:           canRedo ? '#c9d1d9' : '#484f58',
              cursor:          canRedo ? 'pointer' : 'not-allowed',
              transition:      'background 0.15s',
            }}
            onMouseEnter={e => { if (canRedo) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = canRedo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'; }}
          >
            <Redo2 size={14} />
          </button>
        </div>
      )}

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

          suggestOnTriggerCharacters: true,
          quickSuggestions: { other: true, comments: false, strings: false },
          parameterHints:   { enabled: true },
          suggest: {
            snippetsPreventQuickSuggestions: false,
            showSnippets:  true,
            showKeywords:  true,
            showFunctions: true,
            showVariables: true,
            showClasses:   true,
            showStructs:   true,
            filterGraceful: true,
            localityBonus:  true,
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
          cursorWidth: 2,
          mouseWheelScrollSensitivity: 1.5,
        }}
      />
    </div>
  );
}
