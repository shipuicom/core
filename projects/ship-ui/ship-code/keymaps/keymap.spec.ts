import { describe, it, expect } from 'vitest';
import { ShipCodeAction, ShipCodeKeymap, matchesShortcut } from './keymap';
import { SUBLIME_KEYMAP } from './sublime.keymap';
import { VSCODE_KEYMAP } from './vscode.keymap';

/**
 * All actions that must be present in every keymap.
 * This list is the source of truth — if a new action is added to ShipCodeAction,
 * it must also be added here and to every keymap.
 */
const ALL_ACTIONS: ShipCodeAction[] = [
  'code.caret.moveLeft',
  'code.caret.moveRight',
  'code.caret.moveUp',
  'code.caret.moveDown',
  'code.caret.moveWordLeft',
  'code.caret.moveWordRight',
  'code.caret.moveLineStart',
  'code.caret.moveLineEnd',
  'code.caret.moveDocStart',
  'code.caret.moveDocEnd',
  'code.selection.selectAll',
  'code.selection.selectWord',
  'code.selection.selectLine',
  'code.selection.addCaretAbove',
  'code.selection.addCaretBelow',
  'code.edit.indent',
  'code.edit.outdent',
  'code.edit.undo',
  'code.edit.redo',
  'code.edit.deleteWordLeft',
  'code.edit.deleteWordRight',
  'code.edit.deleteLine',
  'code.edit.moveLineUp',
  'code.edit.moveLineDown',
  'code.edit.duplicateLine',
  'code.edit.toggleComment',
  'code.search.find',
  'code.search.replace',
];

function assertKeymapComplete(keymap: ShipCodeKeymap, name: string): void {
  for (const action of ALL_ACTIONS) {
    expect(keymap[action], `${name} missing action: ${action}`).toBeDefined();
    expect(typeof keymap[action], `${name}[${action}] should be a string`).toBe('string');
    expect(keymap[action].length, `${name}[${action}] should not be empty`).toBeGreaterThan(0);
  }
}

describe('Sublime Keymap', () => {
  it('should have a mapping for every ShipCodeAction', () => {
    assertKeymapComplete(SUBLIME_KEYMAP, 'SUBLIME_KEYMAP');
  });

  it('should map Alt+ArrowLeft to code.caret.moveWordLeft', () => {
    expect(SUBLIME_KEYMAP['code.caret.moveWordLeft']).toBe('Alt+ArrowLeft');
  });

  it('should map ctrlOrCmd+Shift+ArrowUp to code.edit.moveLineUp', () => {
    expect(SUBLIME_KEYMAP['code.edit.moveLineUp']).toBe('ctrlOrCmd+Shift+ArrowUp');
  });
});

describe('VS Code Keymap', () => {
  it('should have a mapping for every ShipCodeAction', () => {
    assertKeymapComplete(VSCODE_KEYMAP, 'VSCODE_KEYMAP');
  });

  it('should map ctrlOrCmd+ArrowLeft to code.caret.moveWordLeft (differs from Sublime)', () => {
    expect(VSCODE_KEYMAP['code.caret.moveWordLeft']).toBe('ctrlOrCmd+ArrowLeft');
  });

  it('should map Alt+ArrowUp to code.edit.moveLineUp (differs from Sublime)', () => {
    expect(VSCODE_KEYMAP['code.edit.moveLineUp']).toBe('Alt+ArrowUp');
  });

  it('should share unchanged bindings with Sublime', () => {
    // These should be the same in both keymaps
    expect(VSCODE_KEYMAP['code.edit.undo']).toBe(SUBLIME_KEYMAP['code.edit.undo']);
    expect(VSCODE_KEYMAP['code.selection.selectAll']).toBe(SUBLIME_KEYMAP['code.selection.selectAll']);
    expect(VSCODE_KEYMAP['code.caret.moveLeft']).toBe(SUBLIME_KEYMAP['code.caret.moveLeft']);
  });
});

describe('matchesShortcut', () => {
  const ev = (key: string, mods: Partial<{ ctrl: boolean; meta: boolean; alt: boolean; shift: boolean }> = {}) => ({
    key,
    ctrlKey: !!mods.ctrl,
    metaKey: !!mods.meta,
    altKey: !!mods.alt,
    shiftKey: !!mods.shift,
  });

  it('resolves ctrlOrCmd per platform', () => {
    expect(matchesShortcut(ev('z', { meta: true }), 'ctrlOrCmd+z', true)).toBe(true);
    expect(matchesShortcut(ev('z', { ctrl: true }), 'ctrlOrCmd+z', true)).toBe(false);
    expect(matchesShortcut(ev('z', { ctrl: true }), 'ctrlOrCmd+z', false)).toBe(true);
  });

  it('requires named modifiers and rejects extras', () => {
    expect(matchesShortcut(ev('ArrowLeft', { alt: true }), 'Alt+ArrowLeft', true)).toBe(true);
    expect(matchesShortcut(ev('ArrowLeft'), 'Alt+ArrowLeft', true)).toBe(false);
    expect(matchesShortcut(ev('ArrowLeft', { alt: true, meta: true }), 'Alt+ArrowLeft', true)).toBe(false);
  });

  it('supports alternative chords separated by comma', () => {
    expect(matchesShortcut(ev('Home'), 'Home, ctrlOrCmd+ArrowLeft', true)).toBe(true);
    expect(matchesShortcut(ev('ArrowLeft', { meta: true }), 'Home, ctrlOrCmd+ArrowLeft', true)).toBe(true);
  });

  it('shift chords match shifted letters', () => {
    expect(matchesShortcut(ev('z', { meta: true, shift: true }), 'ctrlOrCmd+Shift+z', true)).toBe(true);
    expect(matchesShortcut(ev('z', { meta: true }), 'ctrlOrCmd+Shift+z', true)).toBe(false);
  });

  it('punctuation keys ignore the shift state', () => {
    expect(matchesShortcut(ev('/', { meta: true }), 'ctrlOrCmd+/', true)).toBe(true);
    expect(matchesShortcut(ev('/', { meta: true, shift: true }), 'ctrlOrCmd+/', true)).toBe(true);
  });
});
