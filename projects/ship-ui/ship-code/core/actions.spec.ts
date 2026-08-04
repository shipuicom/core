import { describe, expect, it } from 'vitest';
import { ActionContext, dispatchAction, hasAction, registerAction } from './actions';
import { createDocument } from './document';
import { flatCaret, primaryFlat } from './flat-motion';
import { indexFor } from './line-index';

const ctx = (text: string, pos = 0): ActionContext => ({ doc: createDocument(text), selection: flatCaret(pos) });

describe('action registry', () => {
  it('registers a handler and dispatches it by name', () => {
    let ran = false;
    registerAction('test.spec.ping', (context) => {
      ran = true;
      return context;
    });
    const result = dispatchAction('test.spec.ping', ctx('hello'));
    expect(ran).toBe(true);
    expect(result).not.toBe(false);
  });

  it('dispatching an unknown action returns false', () => {
    expect(dispatchAction('test.spec.unknown', ctx('hello'))).toBe(false);
    expect(hasAction('test.spec.unknown')).toBe(false);
  });

  it('handlers receive (doc, selection) and return the next context', () => {
    registerAction('test.spec.echo', ({ doc, selection }) => ({ doc, selection }));
    const input = ctx('alpha\nbeta', 3);
    const result = dispatchAction('test.spec.echo', input) as ActionContext;
    expect(result.doc).toBe(input.doc);
    expect(result.selection).toBe(input.selection);
  });

  it('a handler returning null reports "not applicable" as false', () => {
    registerAction('test.spec.noop', () => null);
    expect(dispatchAction('test.spec.noop', ctx('x'))).toBe(false);
  });

  it('a motion dispatch moves every cursor, not just the primary', () => {
    // The registry is the extension surface: it must behave like the keyboard
    // path, which moves all cursors — not silently collapse a multi-cursor.
    const doc = createDocument('aaa\nbbb');
    const selection = { ranges: [{ anchor: 0, head: 0 }, { anchor: 4, head: 4 }], primary: 0 };
    const result = dispatchAction('code.caret.moveRight', { doc, selection }) as ActionContext;
    expect(result.selection.ranges.map((r) => r.head)).toEqual([1, 5]);
  });

  it("dispatching 'code.caret.moveRight' moves the caret right", () => {
    const result = dispatchAction('code.caret.moveRight', ctx('hello', 2)) as ActionContext;
    expect(primaryFlat(result.selection)).toEqual({ anchor: 3, head: 3, goalColumn: undefined });
  });

  it("dispatching 'code.caret.moveDown' carries the goal column", () => {
    const start = ctx('longline\nab\nlongline', 4); // line 0, col 4
    const down = dispatchAction('code.caret.moveDown', start) as ActionContext;
    const index = indexFor(down.doc);
    expect(index.pointAt(primaryFlat(down.selection).head)).toEqual({ line: 1, column: 2 });
    const down2 = dispatchAction('code.caret.moveDown', down) as ActionContext;
    expect(index.pointAt(primaryFlat(down2.selection).head)).toEqual({ line: 2, column: 4 });
  });

  it("dispatching 'code.selection.selectAll' selects the whole document", () => {
    const result = dispatchAction('code.selection.selectAll', ctx('ab\ncd', 1)) as ActionContext;
    expect(primaryFlat(result.selection)).toEqual({ anchor: 0, head: 5 });
  });

  it("every keymap motion/selection action has a built-in handler", () => {
    for (const name of [
      'code.caret.moveLeft', 'code.caret.moveRight', 'code.caret.moveUp', 'code.caret.moveDown',
      'code.caret.moveWordLeft', 'code.caret.moveWordRight', 'code.caret.moveLineStart', 'code.caret.moveLineEnd',
      'code.caret.moveDocStart', 'code.caret.moveDocEnd',
      'code.selection.selectAll', 'code.selection.selectWord', 'code.selection.selectLine',
    ]) {
      expect(hasAction(name), name).toBe(true);
    }
  });
});
