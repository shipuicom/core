// ---------------------------------------------------------------------------
// ShipCode — Keymap Types
// ---------------------------------------------------------------------------

/**
 * All named actions that ship-code supports.
 * Keymaps map these action names to keyboard shortcut strings.
 */
export type ShipCodeAction =
  | 'code.caret.moveLeft'
  | 'code.caret.moveRight'
  | 'code.caret.moveUp'
  | 'code.caret.moveDown'
  | 'code.caret.moveWordLeft'
  | 'code.caret.moveWordRight'
  | 'code.caret.moveLineStart'
  | 'code.caret.moveLineEnd'
  | 'code.caret.moveDocStart'
  | 'code.caret.moveDocEnd'
  | 'code.selection.selectAll'
  | 'code.selection.selectWord'
  | 'code.selection.selectLine'
  | 'code.selection.addCaretAbove'
  | 'code.selection.addCaretBelow'
  | 'code.selection.selectAllOccurrences'
  | 'code.selection.collapseCarets'
  | 'code.edit.indent'
  | 'code.edit.outdent'
  | 'code.edit.undo'
  | 'code.edit.redo'
  | 'code.edit.deleteWordLeft'
  | 'code.edit.deleteWordRight'
  | 'code.edit.deleteLine'
  | 'code.edit.moveLineUp'
  | 'code.edit.moveLineDown'
  | 'code.edit.duplicateLine'
  | 'code.edit.toggleComment'
  | 'code.search.find'
  | 'code.search.replace';

/**
 * A keymap is a complete mapping from every ShipCodeAction to its keyboard shortcut string.
 * Shortcut format follows ShipA11yKeybindingsService conventions:
 * - `ctrlOrCmd+key` for platform-aware modifier
 * - `Shift+key`, `Alt+key` for modifiers
 * - Multiple shortcuts separated by `, `
 */
export type ShipCodeKeymap = Record<ShipCodeAction, string>;

// ---------------------------------------------------------------------------
// Shortcut matching
// ---------------------------------------------------------------------------

/** The subset of KeyboardEvent a shortcut match reads — keeps tests DOM-free. */
export interface ShortcutKeyEvent {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}

/**
 * Does an event match a shortcut spec (`"ctrlOrCmd+Shift+z, F2"`)?
 * `isMac` resolves `ctrlOrCmd` to meta (mac) or ctrl (elsewhere); modifiers
 * not named by a chord must not be pressed.
 */
export function matchesShortcut(event: ShortcutKeyEvent, spec: string, isMac: boolean): boolean {
  return spec.split(',').some((chord) => matchesChord(event, chord.trim(), isMac));
}

function matchesChord(event: ShortcutKeyEvent, chord: string, isMac: boolean): boolean {
  if (!chord) return false;
  const parts = chord.split('+');
  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1).map((m) => m.toLowerCase()));

  const wantCtrlOrCmd = mods.has('ctrlorcmd');
  const wantCtrl = mods.has('ctrl') || (wantCtrlOrCmd && !isMac);
  const wantMeta = mods.has('meta') || mods.has('cmd') || (wantCtrlOrCmd && isMac);
  const wantAlt = mods.has('alt');
  const wantShift = mods.has('shift');

  if (event.ctrlKey !== wantCtrl || event.metaKey !== wantMeta || event.altKey !== wantAlt) return false;
  // Shift is compared only when the key names it or is a letter/named key —
  // punctuation specs (`ctrlOrCmd+/`) accept whatever shift state produces
  // the character.
  const isCharKey = key.length === 1 && !/[a-z0-9]/i.test(key);
  if (!isCharKey && event.shiftKey !== wantShift) return false;

  return event.key.toLowerCase() === key.toLowerCase();
}
