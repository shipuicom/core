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
  // VS Code's platform split, spelled with explicit `cmd`/`ctrl` rather than
  // `ctrlOrCmd`: word motion is Alt+Arrow on macOS and Ctrl+Arrow elsewhere,
  // while Cmd+Arrow is line start/end on macOS. A `ctrlOrCmd` word binding
  // would double-bind Cmd+Left with the inherited line-start chord — and the
  // word motion wins the match order, making line start/end unreachable.
  'code.caret.moveWordLeft': 'Alt+ArrowLeft, ctrl+ArrowLeft',
  'code.caret.moveWordRight': 'Alt+ArrowRight, ctrl+ArrowRight',
  'code.caret.moveLineStart': 'Home, cmd+ArrowLeft',
  'code.caret.moveLineEnd': 'End, cmd+ArrowRight',
};
