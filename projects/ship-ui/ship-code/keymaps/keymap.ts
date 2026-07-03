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
