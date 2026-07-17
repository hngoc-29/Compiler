/**
 * lib/shortcuts.ts
 * Persistent shortcut settings stored in localStorage.
 */

export interface Shortcuts {
    run: string;
    format: string;
    toggleSidebar: string;
    toggleTerminal: string;
    focusEditor: string;
}

export const DEFAULT_SHORTCUTS: Shortcuts = {
    run: 'Ctrl+Enter',
    format: 'Alt+Shift+F',
    toggleSidebar: 'Ctrl+B',
    toggleTerminal: 'Ctrl+`',
    focusEditor: 'Ctrl+1',
};

const KEY = 'cpp-editor-shortcuts-v1';

export function loadShortcuts(): Shortcuts {
    if (typeof window === 'undefined') return DEFAULT_SHORTCUTS;
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return { ...DEFAULT_SHORTCUTS };
        return { ...DEFAULT_SHORTCUTS, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_SHORTCUTS };
    }
}

export function saveShortcuts(s: Shortcuts): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(s));
}

export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
    const parts = shortcut.toLowerCase().split('+').map(p => p.trim());
    const ctrl = parts.includes('ctrl') || parts.includes('cmd');
    const shift = parts.includes('shift');
    const alt = parts.includes('alt');
    const meta = parts.includes('meta') || parts.includes('cmd');

    const keyPart = parts[parts.length - 1];

    if (e.ctrlKey !== ctrl && e.metaKey !== meta) {
        // Allow Ctrl or Meta to match 'ctrl' or 'cmd'
        if (!(ctrl && (e.ctrlKey || e.metaKey))) return false;
    }
    if (e.shiftKey !== shift) return false;
    if (e.altKey !== alt) return false;

    const key = e.key.toLowerCase();
    const code = e.code.toLowerCase();

    if (keyPart === 'enter' && key === 'enter') return true;
    if (keyPart === 'space' && key === ' ') return true;
    if (keyPart === 'esc' && key === 'escape') return true;
    if (keyPart === '`' && key === '`') return true;

    if (key === keyPart) return true;
    if (code === `key${keyPart}`) return true;
    if (code === `digit${keyPart}`) return true;

    return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toMonacoKeybinding(monaco: any, shortcut: string): number {
    const parts = shortcut.toLowerCase().split('+').map(p => p.trim());
    let binding = 0;

    if (parts.includes('ctrl') || parts.includes('cmd')) binding |= monaco.KeyMod.CtrlCmd;
    if (parts.includes('shift')) binding |= monaco.KeyMod.Shift;
    if (parts.includes('alt')) binding |= monaco.KeyMod.Alt;
    if (parts.includes('meta')) binding |= monaco.KeyMod.WinCtrl;

    const keyPart = parts[parts.length - 1];

    if (keyPart === 'enter') binding |= monaco.KeyCode.Enter;
    else if (keyPart === 'space') binding |= monaco.KeyCode.Space;
    else if (keyPart === 'esc') binding |= monaco.KeyCode.Escape;
    else if (keyPart === '`') binding |= monaco.KeyCode.Backquote;
    else if (keyPart.length === 1 && keyPart >= 'a' && keyPart <= 'z') {
        binding |= monaco.KeyCode[`Key${keyPart.toUpperCase()}` as keyof typeof monaco.KeyCode] as number;
    } else if (keyPart.length === 1 && keyPart >= '0' && keyPart <= '9') {
        binding |= monaco.KeyCode[`Digit${keyPart}` as keyof typeof monaco.KeyCode] as number;
    }

    return binding;
}
