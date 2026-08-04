// @vitest-environment jsdom

import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { logicalRangesInSpan, normalizeLogical, shiftRange } from './editor-multi-selection';
import { logicalToPos } from './editor-flat-positions';
import { ASTBlockNode, ASTDocument, LogicalPosition, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import * as B from './standard-behaviors';

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const r = (from: number, to: number): LogicalSelection => ({ from, to });

describe('normalizeLogical', () => {
  it('sorts ranges by start', () => {
    expect(normalizeLogical([r(30, 35), r(4, 8), r(12, 12)])).toEqual([r(4, 8), r(12, 12), r(30, 35)]);
  });

  it('merges overlapping ranges', () => {
    expect(normalizeLogical([r(0, 10), r(5, 15)])).toEqual([r(0, 15)]);
  });

  it('merges touching ranges — a caret at an edge is inside the selection', () => {
    expect(normalizeLogical([r(0, 5), r(5, 5)])).toEqual([r(0, 5)]);
  });

  it('dedupes identical carets', () => {
    expect(normalizeLogical([r(7, 7), r(7, 7)])).toEqual([r(7, 7)]);
  });

  it('keeps carets that do not touch', () => {
    expect(normalizeLogical([r(7, 7), r(9, 9)])).toEqual([r(7, 7), r(9, 9)]);
  });

  it('copies rather than aliasing its input', () => {
    const input = [r(0, 5)];
    const out = normalizeLogical(input);
    expect(out[0]).not.toBe(input[0]);
  });
});

describe('logicalRangesInSpan', () => {
  const many = normalizeLogical(Array.from({ length: 400 }, (_, i) => r(i * 10, i * 10 + 4)));

  it('returns only what intersects the span', () => {
    expect(logicalRangesInSpan(many, 100, 124)).toEqual([r(100, 104), r(110, 114), r(120, 124)]);
  });

  it('includes a range straddling the span start', () => {
    expect(logicalRangesInSpan(many, 102, 105)).toEqual([r(100, 104)]);
  });

  it('excludes a range ending just before the span', () => {
    expect(logicalRangesInSpan(many, 105, 109)).toEqual([]);
  });

  it('returns nothing past the last range', () => {
    expect(logicalRangesInSpan(many, 99_000, 99_999)).toEqual([]);
  });
});

describe('shiftRange', () => {
  it('shifts both ends', () => {
    expect(shiftRange(r(4, 9), 3)).toEqual(r(7, 12));
  });

  it('clamps at zero', () => {
    expect(shiftRange(r(1, 2), -5)).toEqual(r(0, 0));
  });
});

describe('EditorSelectionService multi-range state', () => {
  let selection: EditorSelectionService;
  beforeEach(() => {
    selection = new EditorSelectionService();
  });

  it('reports a single cursor when there are no secondaries', () => {
    selection.live.set(r(5, 5));
    expect(selection.isMulti()).toBe(false);
    expect(selection.ranges()).toEqual([r(5, 5)]);
  });

  it('folds the primary into the sorted set', () => {
    selection.live.set(r(50, 50));
    selection.secondary.set([r(10, 10), r(30, 30)]);
    expect(selection.isMulti()).toBe(true);
    expect(selection.ranges()).toEqual([r(10, 10), r(30, 30), r(50, 50)]);
  });

  it('merges a secondary that overlaps the primary', () => {
    selection.live.set(r(10, 20));
    selection.secondary.set([r(15, 25)]);
    expect(selection.ranges()).toEqual([r(10, 25)]);
  });

  it('clears the secondaries', () => {
    selection.live.set(r(0, 0));
    selection.secondary.set([r(10, 10)]);
    selection.clearSecondary();
    expect(selection.isMulti()).toBe(false);
    expect(selection.ranges()).toEqual([r(0, 0)]);
  });
});

describe('runAtEveryCursor', () => {
  let engine: EditorEngineService;

  const flat = (blockIndex: number, offset: number) =>
    logicalToPos(engine.document(), { blockIndex, inlineIndex: 0, offset } as LogicalPosition);
  const textOf = (i: number) =>
    (engine.document()[i].content as { text?: string }[]).map((n) => n.text ?? '').join('');
  const texts = () => engine.document().map((_, i) => textOf(i));

  /** Carets at `offset` in each of `blocks`; the first is primary. */
  const caretsIn = (blocks: number[], offset: number) => {
    const positions = blocks.map((b) => flat(b, offset));
    engine.selection.live.set({ from: positions[0], to: positions[0] });
    engine.selection.secondary.set(positions.slice(1).map((at) => ({ from: at, to: at })));
  };

  beforeEach(() => {
    const injector = Injector.create({
      providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
    });
    engine = runInInjectionContext(injector, () => new EditorEngineService());
    for (const behavior of Object.values(B)) {
      if (typeof behavior === 'function') continue;
      engine.register(behavior as never);
    }
    const doc: ASTDocument = [p('one'), p('two'), p('three')];
    engine.load(doc);
  });

  it('inserts at every cursor', () => {
    caretsIn([0, 1, 2], 0);
    engine.runAtEveryCursor(() => engine.insertText('> '));
    expect(texts()).toEqual(['> one', '> two', '> three']);
  });

  it('lands the edit at each cursor even as earlier edits shift the document', () => {
    // Cursor 3 starts at a position that the first two inserts push forward;
    // without the running shift it would land two characters early.
    caretsIn([0, 1, 2], 3);
    engine.runAtEveryCursor(() => engine.insertText('!'));
    expect(texts()).toEqual(['one!', 'two!', 'thr!ee']);
  });

  it('leaves every cursor after its own insertion', () => {
    caretsIn([0, 1, 2], 0);
    engine.runAtEveryCursor(() => engine.insertText('ab'));
    const all = engine.selection.ranges();
    expect(all).toHaveLength(3);
    expect(all.map((range) => range.from)).toEqual([flat(0, 2), flat(1, 2), flat(2, 2)]);
  });

  it('takes one undo to reverse the whole fan-out', () => {
    caretsIn([0, 1, 2], 0);
    engine.runAtEveryCursor(() => engine.insertText('> '));
    engine.undo();
    expect(texts()).toEqual(['one', 'two', 'three']);
  });

  it('restores every cursor on undo', () => {
    caretsIn([0, 1, 2], 0);
    engine.runAtEveryCursor(() => engine.insertText('> '));
    engine.undo();
    expect(engine.selection.ranges()).toHaveLength(3);
  });

  it('takes one redo to reapply the whole fan-out', () => {
    caretsIn([0, 1, 2], 0);
    engine.runAtEveryCursor(() => engine.insertText('> '));
    engine.undo();
    engine.redo();
    expect(texts()).toEqual(['> one', '> two', '> three']);
    expect(engine.selection.ranges()).toHaveLength(3);
  });

  it('undoes back past a fan-out to a preceding single edit', () => {
    engine.selection.live.set({ from: flat(0, 3), to: flat(0, 3) });
    engine.insertText('X');
    caretsIn([0, 1, 2], 0);
    engine.runAtEveryCursor(() => engine.insertText('> '));
    engine.undo();
    expect(texts()).toEqual(['oneX', 'two', 'three']);
    engine.undo();
    expect(texts()).toEqual(['one', 'two', 'three']);
  });

  it('does not group a following single-cursor edit with the fan-out', () => {
    caretsIn([0, 1, 2], 0);
    engine.runAtEveryCursor(() => engine.insertText('> '));
    engine.selection.clearSecondary();
    engine.selection.live.set({ from: flat(0, 5), to: flat(0, 5) });
    engine.insertText('!');
    expect(texts()).toEqual(['> one!', '> two', '> three']);
    engine.undo();
    expect(texts()).toEqual(['> one', '> two', '> three']);
  });

  it('deletes at every cursor', () => {
    caretsIn([0, 1, 2], 1);
    engine.runAtEveryCursor(() => engine.handleBackspace());
    expect(texts()).toEqual(['ne', 'wo', 'hree']);
  });

  it('runs the edit once when only one cursor is live', () => {
    engine.selection.live.set({ from: flat(0, 0), to: flat(0, 0) });
    engine.runAtEveryCursor(() => engine.insertText('#'));
    expect(texts()).toEqual(['#one', 'two', 'three']);
    // A single cursor produces an ordinary ungrouped transaction.
    engine.undo();
    expect(texts()).toEqual(['one', 'two', 'three']);
  });

  it('merges cursors that collide into one', () => {
    // Two carets one apart in the same block; each deletes backwards, so both
    // end at the same offset and become a single cursor.
    const a = flat(0, 1);
    const b = flat(0, 2);
    engine.selection.live.set({ from: a, to: a });
    engine.selection.secondary.set([{ from: b, to: b }]);
    engine.runAtEveryCursor(() => engine.handleBackspace());
    expect(textOf(0)).toBe('e');
    expect(engine.selection.ranges()).toHaveLength(1);
  });
});
