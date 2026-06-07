'use client';

/**
 * components/CodeEditor.tsx  v5
 * - Controlled by EditorSettings (suggestions, paramHints, minimap, etc.)
 * - Rich signature help (parameter hints) via registerCppSuggestions
 * - Undo/Redo buttons
 * - Mobile interactions
 */

import dynamic from 'next/dynamic';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, Undo2, Redo2, Copy, Check } from 'lucide-react';
import type { EditorSettings } from '@/lib/editor-settings';
import { useI18n } from '@/lib/i18n-context';

// Track globally so we only register Monaco providers once (they persist across mounts)
const _registeredLangs = new Set<string>();

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
  value:        string;
  onChange:     (value: string | undefined) => void;
  onRun:        () => void;
  language?:    string;
  readOnly?:    boolean;
  diagnostics?: { line: number; col: number; message: string; severity: 'error' | 'warning' }[];
  settings?:    EditorSettings;
}

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setupMobileInteractions(editor: any, onSelectionChange?: (text: string | null) => void) {
  if (!isTouchDevice()) return;
  const domNode: HTMLElement | null = editor.getDomNode();
  if (!domNode) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let savedSelection: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let latestSelection: any = null;

  // Guard: don't clear selection when focus moves to an external button (e.g. Copy btn)
  let justBlurred = false;
  let blurClearTimer: ReturnType<typeof setTimeout> | null = null;
  editor.onDidBlurEditorText(() => {
    justBlurred = true;
    if (blurClearTimer) clearTimeout(blurClearTimer);
    blurClearTimer = setTimeout(() => { justBlurred = false; }, 300);
  });

  editor.onDidChangeCursorSelection((e: any) => {
    latestSelection = e.selection;
    if (!e.selection.isEmpty()) {
      savedSelection = e.selection;
      if (onSelectionChange) {
        const model = editor.getModel();
        onSelectionChange(model ? model.getValueInRange(e.selection) : null);
      }
    } else if (!justBlurred) {
      // Only clear when selection is lost via user action inside the editor,
      // NOT when editor lost focus to the Copy button or another external element
      onSelectionChange?.(null);
    }
  });

  editor.onDidFocusEditorWidget(() => {
    justBlurred = false;
    if (blurClearTimer) { clearTimeout(blurClearTimer); blurClearTimer = null; }
    setTimeout(() => {
      const cur = editor.getSelection();
      if (savedSelection && cur && cur.isEmpty() && !savedSelection.isEmpty()) {
        editor.setSelection(savedSelection);
      }
    }, 50);
  });

  const textarea = domNode.querySelector('textarea');
  if (textarea) {
    textarea.addEventListener('beforeinput', (e: Event) => {
      const ie = e as InputEvent;
      if (ie.inputType !== 'insertText' || !ie.data) return;
      const sel = (latestSelection && !latestSelection.isEmpty())
        ? latestSelection
        : (savedSelection && !savedSelection.isEmpty() ? savedSelection : null);
      if (!sel) return;
      editor.executeEdits('mobile-replace', [{ range: sel, text: '' }]);
      editor.setPosition({ lineNumber: sel.startLineNumber, column: sel.startColumn });
      savedSelection = null; latestSelection = null;
    }, true);

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      const sel = editor.getSelection();
      if (!sel || sel.isEmpty()) return;
      e.preventDefault();
      editor.executeEdits('mobile-delete', [{ range: sel, text: '' }]);
      savedSelection = null; latestSelection = null;
    }, true);
  }

  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let isSelectMode = false;
  let anchorPos: { lineNumber: number; column: number } | null = null;

  const clientToPosition = (cx: number, cy: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = (editor as any).getTargetAtClientPoint(cx, cy);
    return target?.position ?? null;
  };

  const cancelLongPress = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  };

  domNode.addEventListener('touchstart', (e: TouchEvent) => {
    isSelectMode = false; anchorPos = null; cancelLongPress();
    const touch = e.touches[0];
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      const pos = clientToPosition(touch.clientX, touch.clientY);
      if (!pos) return;
      const model = editor.getModel();
      const word  = model?.getWordAtPosition(pos);
      if (word) {
        anchorPos = { lineNumber: pos.lineNumber, column: word.startColumn };
        editor.setSelection({ startLineNumber: pos.lineNumber, startColumn: word.startColumn, endLineNumber: pos.lineNumber, endColumn: word.endColumn });
      } else {
        anchorPos = { lineNumber: pos.lineNumber, column: pos.column };
        editor.setPosition(pos);
      }
      isSelectMode = true;
      if (navigator.vibrate) navigator.vibrate(30);
    }, 350);
  }, { passive: true });

  domNode.addEventListener('touchmove', (e: TouchEvent) => {
    if (!isSelectMode) { cancelLongPress(); return; }
    e.preventDefault();
    const touch = e.touches[0];
    const endPos = clientToPosition(touch.clientX, touch.clientY);
    if (!endPos || !anchorPos) return;
    const before = endPos.lineNumber < anchorPos.lineNumber || (endPos.lineNumber === anchorPos.lineNumber && endPos.column < anchorPos.column);
    editor.setSelection(before
      ? { startLineNumber: endPos.lineNumber, startColumn: endPos.column, endLineNumber: anchorPos.lineNumber, endColumn: anchorPos.column }
      : { startLineNumber: anchorPos.lineNumber, startColumn: anchorPos.column, endLineNumber: endPos.lineNumber, endColumn: endPos.column });
    const rect = domNode.getBoundingClientRect();
    const relY = touch.clientY - rect.top;
    const scrollBy = relY < 60 ? -40 : relY > rect.height - 60 ? 40 : 0;
    if (scrollBy) editor.setScrollTop(editor.getScrollTop() + scrollBy);
  }, { passive: false });

  const endSelect = () => { cancelLongPress(); isSelectMode = false; anchorPos = null; };
  domNode.addEventListener('touchend',    endSelect, { passive: true });
  domNode.addEventListener('touchcancel', endSelect, { passive: true });
}

export default function CodeEditor({
  value, onChange, onRun, language = 'cpp', readOnly = false, diagnostics = [], settings,
}: CodeEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef    = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const ce = t.codeEditor;

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  // Mobile copy/select state
  const [isTouch,      setIsTouch]      = useState(false);
  const [mobileSelText, setMobileSelText] = useState<string | null>(null);
  const [copyDone,     setCopyDone]     = useState(false);
  // Ref holds the latest selected text — never stale, immune to re-render timing
  const mobileSelRef = useRef<string | null>(null);

  const handleUndo = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'undo', null);
    editorRef.current?.focus();
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'redo', null);
    editorRef.current?.focus();
  }, []);

  // ── Register cpp suggestions whenever language changes to cpp/c ───────────
  useEffect(() => {
    if (language !== 'cpp' && language !== 'c') return;
    if (_registeredLangs.has(language)) return;
    // monacoRef might not be set yet if editor isn't mounted — handleMount will
    // also try; whichever runs first wins.
    if (!monacoRef.current) return;
    _registeredLangs.add(language);
    import('@/lib/cpp-suggestions').then(({ registerCppSuggestions }) => {
      registerCppSuggestions(monacoRef.current, { snippets: settings?.snippets !== false });
    });
  }, [language, settings]);

  // Apply diagnostics
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;
    if (diagnostics.length === 0) {
      monaco.editor.setModelMarkers(model, 'cppeditor', []);
      return;
    }
    const markers = diagnostics.map(d => ({
      severity: d.severity === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
      message: d.message,
      startLineNumber: d.line, startColumn: d.col,
      endLineNumber: d.line,
      endColumn: Math.min(d.col + 120, model.getLineMaxColumn(d.line) ?? 999),
      source: 'compiler',
    }));
    monaco.editor.setModelMarkers(model, 'cppeditor', markers);
  }, [diagnostics]);

  // Live-update editor options when settings change
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !settings) return;

    editor.updateOptions({
      minimap:                 { enabled: settings.minimap },
      wordWrap:                settings.wordWrap ? 'on' : 'off',
      lineNumbers:             settings.lineNumbers ? 'on' : 'off',
      bracketPairColorization: { enabled: settings.bracketPairColorization },
      renderWhitespace:        settings.renderWhitespace ? 'selection' : 'none',
      fontLigatures:           settings.fontLigatures,
      cursorBlinking:          settings.smoothCaret ? 'smooth' : 'blink',
      cursorSmoothCaretAnimation: settings.smoothCaret ? 'on' : 'off',
      fontSize:                settings.fontSize,
      tabSize:                 settings.tabSize,
      // Suggestions master toggle
      suggestOnTriggerCharacters: settings.suggestions,
      quickSuggestions: settings.suggestions && settings.quickSuggestions
        ? { other: true, comments: false, strings: false }
        : false,
      parameterHints:  { enabled: settings.suggestions && settings.parameterHints },
      suggest: {
        snippetsPreventQuickSuggestions: false,
        showSnippets:  settings.suggestions && settings.snippets,
        showKeywords:  settings.suggestions,
        showFunctions: settings.suggestions,
        showVariables: settings.suggestions,
        showClasses:   settings.suggestions,
        showStructs:   settings.suggestions,
        filterGraceful: true,
        localityBonus:  true,
      },
    });
  }, [settings]);

  // Layout on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;
    const relayout = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => { editorRef.current?.layout(); });
    };
    const vv = window.visualViewport;
    if (vv) { vv.addEventListener('resize', relayout); vv.addEventListener('scroll', relayout); }
    window.addEventListener('resize', relayout);
    return () => {
      cancelAnimationFrame(rafId);
      if (vv) { vv.removeEventListener('resize', relayout); vv.removeEventListener('scroll', relayout); }
      window.removeEventListener('resize', relayout);
    };
  }, []);

  // Detect touch device (client-side only)
  useEffect(() => { setIsTouch(isTouchDevice()); }, []);

  // Suppress Monaco's internal CancellationError unhandled rejections
  // These appear as "ERR Canceled: Canceled" when autocomplete is cancelled by touch events
  useEffect(() => {
    const onUnhandled = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg: string = (reason instanceof Error ? reason.message : String(reason ?? ''));
      if (msg === 'Canceled' || (reason instanceof Error && reason.name === 'Canceled')) {
        e.preventDefault(); // Silently discard — this is normal Monaco autocomplete cancellation
      }
    };
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => window.removeEventListener('unhandledrejection', onUnhandled);
  }, []);

  // ── Mobile copy handlers ──────────────────────────────────────────────────
  const handleCopyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editorRef.current?.getValue() ?? '');
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 1500);
    } catch { /* clipboard permission denied on some browsers */ }
  }, []);

  const handleCopySel = useCallback(async () => {
    const text = mobileSelRef.current; // Always fresh — ref, not state closure
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      mobileSelRef.current = null;
      setCopyDone(true);
      setMobileSelText(null);
      setTimeout(() => setCopyDone(false), 1500);
    } catch { /* clipboard permission denied */ }
  }, []); // No mobileSelText dep — reads ref instead

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => editor.getAction('editor.action.formatDocument')?.run(),
    );

    // Register C++ suggestions (once per Monaco instance, globally tracked)
    if ((language === 'cpp' || language === 'c') && !_registeredLangs.has(language)) {
      _registeredLangs.add(language);
      import('@/lib/cpp-suggestions').then(({ registerCppSuggestions }) => {
        registerCppSuggestions(monaco, { snippets: settings?.snippets !== false });
      });
    }

    // Register user-defined function hints (completion + signatureHelp) for all langs
    import('@/lib/user-fn-hints').then(({ registerUserFnProviders }) => {
      registerUserFnProviders(monaco, language);
    });

    setupMobileInteractions(editor, (text) => {
      mobileSelRef.current = text;   // Ref updated synchronously — always fresh
      setMobileSelText(text);        // State updated for rendering
    });

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
        setCanUndo(true); setCanRedo(true);
      }
    };

    editor.onDidChangeModelContent(trackUndoRedo);
    editor.onDidChangeCursorPosition(trackUndoRedo);

    setTimeout(() => editor.focus(), 50);

    editor.onDidChangeCursorPosition(() => {
      const vv = window.visualViewport;
      if (vv && vv.height < window.innerHeight * 0.75) {
        const pos = editor.getPosition();
        if (pos) editor.revealLineNearTop(pos.lineNumber);
      }
    });
  };

  const btnStyle = (enabled: boolean) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 26,
    background: enabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    color: enabled ? '#c9d1d9' : '#484f58',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'background 0.15s',
  } as React.CSSProperties);

  const s = settings;

  return (
    <div ref={containerRef} style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
      {!readOnly && (
        <div style={{ position: 'absolute', top: 6, right: 10, zIndex: 10, display: 'flex', gap: 4 }}>
          <button onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={!canUndo} style={btnStyle(canUndo)}>
            <Undo2 size={14} />
          </button>
          <button onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={!canRedo} style={btnStyle(canRedo)}>
            <Redo2 size={14} />
          </button>

          {/* ── Mobile copy toolbar ── */}
          {isTouch && (
            mobileSelText ? (
              /* Copy selection — appears when text is selected via long-press */
              <button
                onPointerDown={(e) => e.preventDefault()} // Keep editor focused — selection stays intact
                onClick={handleCopySel}
                title={ce.copySelection}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  height: 26, padding: '0 8px', borderRadius: 6,
                  background: 'rgba(99,102,241,0.25)',
                  border: '1px solid rgba(99,102,241,0.5)',
                  color: copyDone ? '#4ade80' : '#a5b4fc',
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {copyDone ? <Check size={12} /> : <Copy size={12} />}
                <span style={{ marginLeft: 2 }}>
                  {mobileSelText.length > 999
                    ? `${(mobileSelText.length / 1000).toFixed(0)}k`
                    : mobileSelText.length} ch
                </span>
              </button>
            ) : (
              /* Copy All — always visible on touch, copies entire editor content */
              <button
                onPointerDown={(e) => e.preventDefault()} // Keep editor focused
                onClick={handleCopyAll}
                title={ce.copyAll}
                style={{
                  ...btnStyle(true),
                  color: copyDone ? '#4ade80' : undefined,
                  transition: 'color 0.2s',
                }}
              >
                {copyDone ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )
          )}
        </div>
      )}

      <MonacoEditor
        height="100%"
        language={language}
        theme={s?.theme ?? 'vs-dark'}
        value={value}
        onChange={onChange}
        onMount={handleMount}
        options={{
          fontFamily:           "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontSize:             s?.fontSize ?? 13,
          fontLigatures:        s?.fontLigatures ?? true,
          lineHeight:           22,
          minimap:              { enabled: s?.minimap ?? false },
          scrollBeyondLastLine: false,
          wordWrap:             (s?.wordWrap ? 'on' : 'off') as any,
          tabSize:              s?.tabSize ?? 4,
          insertSpaces:         true,
          readOnly,
          folding:              true,
          bracketPairColorization: { enabled: s?.bracketPairColorization ?? true },
          autoClosingBrackets:  'always',
          autoClosingQuotes:    'always',
          // Suggestions
          suggestOnTriggerCharacters: s?.suggestions ?? true,
          quickSuggestions: (s?.suggestions ?? true) && (s?.quickSuggestions ?? true)
            ? { other: true, comments: false, strings: false }
            : false,
          parameterHints:  { enabled: (s?.suggestions ?? true) && (s?.parameterHints ?? true) },
          suggest: {
            snippetsPreventQuickSuggestions: false,
            showSnippets:  (s?.suggestions ?? true) && (s?.snippets ?? true),
            showKeywords:  s?.suggestions ?? true,
            showFunctions: s?.suggestions ?? true,
            showVariables: s?.suggestions ?? true,
            showClasses:   s?.suggestions ?? true,
            showStructs:   s?.suggestions ?? true,
            filterGraceful: true,
            localityBonus:  true,
          },
          acceptSuggestionOnEnter:    'smart',
          smoothScrolling:            true,
          cursorBlinking:             (s?.smoothCaret ?? true) ? 'smooth' : 'blink',
          cursorSmoothCaretAnimation: (s?.smoothCaret ?? true) ? 'on' : 'off',
          padding:                    { top: 10, bottom: 80 },
          lineNumbers:                (s?.lineNumbers ?? true) ? 'on' : 'off',
          lineDecorationsWidth:       6,
          lineNumbersMinChars:        3,
          renderWhitespace:           (s?.renderWhitespace ? 'selection' : 'none') as any,
          overviewRulerLanes:         3,
          hideCursorInOverviewRuler:  false,
          scrollbar: {
            verticalScrollbarSize:   6,
            horizontalScrollbarSize: 6,
            alwaysConsumeMouseWheel: false,
          },
          cursorWidth: 2,
          mouseWheelScrollSensitivity: 1.5,
          glyphMargin: true,
          lightbulb: { enabled: true as any },
        }}
      />
    </div>
  );
}
