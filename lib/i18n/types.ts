/**
 * lib/i18n/types.ts
 * Shape of all translatable strings.
 * Edit this when adding new UI text (then update every language file).
 */

/*  Type helpers                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

interface ShortcutItem  { keys: string[]; desc: string }
interface ShortcutSection { title: string; color: string; items: ShortcutItem[] }
interface ModalSection    { title: string; items: ShortcutItem[] }
interface StatusRow       { label: string; color: string; desc: string }
interface TrickTitle      { title: string }
interface ComplexRow      { n: string; time: string; note: string }
interface TipsFeature     { label?: string; desc?: string; note?: string }
interface ThemeOpt        { value: 'vs-dark' | 'vs' | 'hc-black'; label: string; desc: string }
interface TCSection_Switch { title: string; paras: string[] }
interface TCSection_Add    { title: string; paras: string[]; fields: { name: string; desc: string }[]; note: string }
interface TCSection_Run    { title: string; actions: { label: string; desc: string }[] }
interface TCSection_Read   { title: string; statuses: StatusRow[] }
interface TCSection_Dup    { title: string; paras: string[] }
interface TCSection_Export { title: string; export: { label: string; desc: string }; import: { label: string; desc: string }; formatLabel: string }

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Translation shape                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface Translations {
  /* Guide sidebar/nav */
  guide: {
    navLabel:     string;
    backToEditor: string;
    overview:     string;
    shortcuts:    string;
    testCases:    string;
    cpTips:       string;
  };

  /* Guide overview page */
  overview: {
    title:         string;
    subtitle:      string;
    cards: { title: string; desc: string }[];
    featuresTitle: string;
    features: { title: string; desc: string }[];
    quickStartTitle: string;
    quickStartSteps: (string | { tag: 'link' | 'code' | 'kbd' | 'em'; text: string })[][];
  };

  /* Guide shortcuts page */
  shortcutsPage: {
    title:    string;
    subtitle: string;
    sections: ShortcutSection[];
    tipLabel: string;
    tip:      string;
  };

  /* Guide test cases page */
  testCasesPage: {
    title:    string;
    subtitle: string;
    s1: TCSection_Switch;
    s2: TCSection_Add;
    s3: TCSection_Run;
    s4: TCSection_Read;
    s5: TCSection_Dup;
    s6: TCSection_Export;
    proTip: string;
  };

  /* Guide tips page */
  tipsPage: {
    title:    string;
    subtitle: string;
    s1: { title: string; paras: string[]; insertLabel: string };
    s2: { title: string; desc: string };
    s3: { title: string; tricks: TrickTitle[] };
    s4: { title: string; tips: string[] };
    s5: { title: string; rows: ComplexRow[] };
    s6: { title: string; paras: string[]; features: TipsFeature[] };
  };

  /* ShortcutsModal (in-editor popup) */
  shortcutsModal: {
    title:    string;
    footer:   string;
    sections: ModalSection[];
  };

  /* Header component */
  header: {
    openInput:       string;
    download:        string;
    filenamePrompt:  string;
    downloadSuccess: (name: string) => string;
  };

  /* Settings panel */
  settings: {
    showWarningsDesc: string;
    runTimeoutDesc:   string;
    themes:           ThemeOpt[];
  };

  /* Output panel */
  output: {
    clearOutput: string;
    compiling:   string;
    runHint:     string;
    timeout:     string;
    noRuns:      string;
  };

  /* Test case panel */
  testCasePanel: {
    resetResults:  string;
    addTestCase:   string;
    runAll:        string;
    editTestCase:  string;
    runThis:       string;
    duplicated:    (label: string) => string;
    exportedN:     (n: number) => string;
    exportError:   string;
    importedN:     (n: number) => string;
    importError:   string;
  };

  /* Test case modal */
  testCaseModal: {
    inputPlaceholder:  string;
    outputPlaceholder: string;
    emptyOutputNote:   string;
  };

  /* Code editor */
  codeEditor: {
    copySelection: string;
    copyAll:       string;
  };

  /* EditorLayout */
  editorLayout: {
    compilingToast:   string;
    compileError:     string;
    timeoutWarning:   string;
    cannotConnect:    string;
    batchCompiling:   string;
    batchRunning:     (n: number) => string;
    sharedBanner:     string;
    editorSettings:   string;
    inputPlaceholder: string;
  };

  /* Templates panel */
  templatesPanel: {
    searchPlaceholder: string;
    insertButton:      string;
  };

  /* Shared view page (/s/[data]) */
  sharedPage: {
    decoding:    string;
    decodeError: string;
    goHome:      string;
  };

}  // Translations
