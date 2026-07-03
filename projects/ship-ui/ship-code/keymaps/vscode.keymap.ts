import { ShipCodeKeymap } from './keymap';
import { SUBLIME_KEYMAP } from './sublime.keymap';

/**
 * VS Code keymap — built-in alternative.
 * Spreads Sublime and overrides the differences.
 */
export const VSCODE_KEYMAP: ShipCodeKeymap = {
  ...SUBLIME_KEYMAP,
  'code.edit.moveLineUp': 'Alt+ArrowUp',
  'code.edit.moveLineDown': 'Alt+ArrowDown',
  'code.edit.duplicateLine': 'Shift+Alt+ArrowDown',
  'code.caret.moveWordLeft': 'ctrlOrCmd+ArrowLeft',
  'code.caret.moveWordRight': 'ctrlOrCmd+ArrowRight',
};
