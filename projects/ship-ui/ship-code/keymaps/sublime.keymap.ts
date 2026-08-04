import { ShipCodeKeymap } from './keymap';

/**
 * Sublime Text keymap — the default for ship-code.
 * Closest to macOS native text editing behavior.
 */
export const SUBLIME_KEYMAP: ShipCodeKeymap = {
  'code.caret.moveLeft': 'ArrowLeft',
  'code.caret.moveRight': 'ArrowRight',
  'code.caret.moveUp': 'ArrowUp',
  'code.caret.moveDown': 'ArrowDown',
  'code.caret.moveWordLeft': 'Alt+ArrowLeft',
  'code.caret.moveWordRight': 'Alt+ArrowRight',
  'code.caret.moveLineStart': 'Home, ctrlOrCmd+ArrowLeft',
  'code.caret.moveLineEnd': 'End, ctrlOrCmd+ArrowRight',
  'code.caret.moveDocStart': 'ctrlOrCmd+Home',
  'code.caret.moveDocEnd': 'ctrlOrCmd+End',
  'code.selection.selectAll': 'ctrlOrCmd+a',
  'code.selection.selectWord': 'ctrlOrCmd+d',
  'code.selection.selectLine': 'ctrlOrCmd+l',
  'code.selection.addCaretAbove': 'ctrlOrCmd+Alt+ArrowUp',
  'code.selection.addCaretBelow': 'ctrlOrCmd+Alt+ArrowDown',
  'code.selection.selectAllOccurrences': 'ctrlOrCmd+Shift+l',
  'code.selection.collapseCarets': 'Escape',
  'code.edit.indent': 'Tab',
  'code.edit.outdent': 'Shift+Tab',
  'code.edit.undo': 'ctrlOrCmd+z',
  'code.edit.redo': 'ctrlOrCmd+Shift+z',
  'code.edit.deleteWordLeft': 'Alt+Backspace',
  'code.edit.deleteWordRight': 'Alt+Delete',
  'code.edit.deleteLine': 'ctrlOrCmd+Shift+k',
  'code.edit.moveLineUp': 'ctrlOrCmd+Shift+ArrowUp',
  'code.edit.moveLineDown': 'ctrlOrCmd+Shift+ArrowDown',
  'code.edit.duplicateLine': 'ctrlOrCmd+Shift+d',
  'code.edit.toggleComment': 'ctrlOrCmd+/',
  'code.search.find': 'ctrlOrCmd+f',
  'code.search.replace': 'ctrlOrCmd+h',
};
