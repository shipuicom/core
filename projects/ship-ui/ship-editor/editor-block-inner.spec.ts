// @vitest-environment jsdom

import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { BaseComponentBlockBehavior } from './sh-editor-component-block';
import { EditorEngineService } from './editor-engine.service';
import { BlockInnerAlgebra, BlockInnerOp, BlockSplice, EditorOp, applyOp, invertOp, registerBlockInnerAlgebra, transformOp } from './editor-transactions';
import { ASTBlockNode, ASTDocument } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { ParagraphBehavior } from './standard-behaviors';

/** A toy inner algebra: attrs `{ n }`, an inner op is a delta; every pair commutes. */
const COUNTER: BlockInnerAlgebra<number> = {
  transform: (op) => op,
  invert: (op) => -op,
  apply: (attrs, op) => ({ ...attrs, n: ((attrs['n'] as number) ?? 0) + op }),
};

class CounterBehavior extends BaseComponentBlockBehavior {
  readonly type = 'counter';
  readonly component = class {};
  override readonly innerAlgebra = COUNTER;
}

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const counter = (n: number): ASTBlockNode => ({ type: 'counter', attrs: { n }, content: [] });
const inner = (blockIndex: number, delta: number, inverse?: number): BlockInnerOp => ({ kind: 'block-inner', blockIndex, type: 'counter', inner: delta, inverse });
const nAt = (doc: ASTDocument, i: number) => doc[i].attrs?.['n'];

function makeEngine(doc: ASTDocument): EditorEngineService {
  const injector = Injector.create({ providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }] });
  const engine = runInInjectionContext(injector, () => new EditorEngineService());
  engine.register(new ParagraphBehavior());
  engine.register(new CounterBehavior());
  engine.load(structuredClone(doc));
  return engine;
}

describe('block-inner ops (pure algebra)', () => {
  registerBlockInnerAlgebra('counter', COUNTER);
  const base: ASTDocument = [p('a'), counter(10), p('b')];

  it('applies through the registered algebra and inverts from the carried inverse', () => {
    const op = inner(1, 5, -5);
    const next = applyOp(base, op);
    expect(nAt(next, 1)).toBe(15);
    expect(nAt(applyOp(next, invertOp(op)), 1)).toBe(10);
    // Unknown type / wrong block: untouched.
    expect(applyOp(base, { ...op, type: 'nope' })).toBe(base);
    expect(applyOp(base, { ...op, blockIndex: 0 })).toBe(base);
  });

  it('moves with a block splice before it and is dropped when the splice removes its block', () => {
    const op = inner(1, 5);
    const insertAbove: BlockSplice = { kind: 'block', at: 0, removed: [], inserted: [p('x'), p('y')] };
    expect(transformOp(op, insertAbove)).toEqual({ ...op, blockIndex: 3 });
    const removeBelow: BlockSplice = { kind: 'block', at: 2, removed: [p('b')], inserted: [] };
    expect(transformOp(op, removeBelow)).toBe(op);
    const removeIt: BlockSplice = { kind: 'block', at: 1, removed: [counter(10)], inserted: [] };
    expect(transformOp(op, removeIt)).toBeNull();
    const replaceIt: BlockSplice = { kind: 'block', at: 1, removed: [counter(10)], inserted: [counter(99)] };
    expect(transformOp(op, replaceIt)).toBeNull();
  });

  it('a splice removing the block carries the stale block patched by the inner op', () => {
    const splice: BlockSplice = { kind: 'block', at: 0, removed: [p('a'), counter(10)], inserted: [p('z')] };
    const out = transformOp(splice, inner(1, 5)) as BlockSplice;
    expect(out.removed[1].attrs).toEqual({ n: 15 });
    // ...so undoing the splice after the peer's edit restores what the peer saw.
    const viaSplice = applyOp(applyOp(base, inner(1, 5)), out);
    expect(nAt(applyOp(viaSplice, invertOp(out)), 1)).toBe(15);
  });

  it('is unaffected by inline splices and leaves them unaffected', () => {
    const op = inner(1, 5);
    const ins: EditorOp = { kind: 'inline', blockIndex: 0, at: 0, removed: [], inserted: [{ type: 'text', text: 'Q' }] };
    expect(transformOp(op, ins)).toBe(op);
    expect(transformOp(ins, op)).toBe(ins);
  });

  it('converges for inner-vs-inner and inner-vs-splice in both orders', () => {
    const cases: [EditorOp, EditorOp][] = [
      [inner(1, 5), inner(1, 7)],
      [inner(1, 5), { kind: 'block', at: 0, removed: [], inserted: [p('x')] }],
      [inner(1, 5), { kind: 'block', at: 2, removed: [p('b')], inserted: [p('c'), p('d')] }],
      [inner(1, 5), { kind: 'inline', blockIndex: 2, at: 1, removed: [], inserted: [{ type: 'text', text: '!' }] }],
    ];
    for (const [a, b] of cases) {
      const a2 = transformOp(a, b, 'left');
      const b2 = transformOp(b, a, 'right');
      const viaA = b2 ? applyOp(applyOp(base, a), b2) : applyOp(base, a);
      const viaB = a2 ? applyOp(applyOp(base, b), a2) : applyOp(base, b);
      expect(JSON.stringify(viaA)).toBe(JSON.stringify(viaB));
    }
  });
});

describe('block-inner ops (engine)', () => {
  const base: ASTDocument = [p('a'), counter(10), p('b')];

  it('applyBlockInner records one undoable transaction with its inverse', () => {
    const engine = makeEngine(base);
    engine.applyBlockInner(1, 5);
    expect(nAt(engine.document(), 1)).toBe(15);
    const tx = engine.lastTransaction()!;
    expect(tx.op).toEqual({ kind: 'block-inner', blockIndex: 1, type: 'counter', inner: 5, inverse: -5 });
    expect(engine.lastInnerOp()).toMatchObject({ blockIndex: 1, inner: 5 });
    engine.undo();
    expect(nAt(engine.document(), 1)).toBe(10);
    engine.redo();
    expect(nAt(engine.document(), 1)).toBe(15);
    // A block without an algebra, or a text block, is left alone.
    engine.applyBlockInner(0, 5);
    expect(engine.document()[0]).toEqual(p('a'));
  });

  it('a remote inner op applies without touching history and local undo still works after it', () => {
    const engine = makeEngine(base);
    engine.applyBlockInner(1, 5);
    engine.applyRemoteOperation(inner(1, 100));
    expect(nAt(engine.document(), 1)).toBe(115);
    expect(engine.canUndo()).toBe(true);
    engine.undo();
    expect(nAt(engine.document(), 1)).toBe(110);
    expect(engine.canUndo()).toBe(false);
  });

  it('a remote splice above re-indexes the local inner transaction', () => {
    const engine = makeEngine(base);
    engine.applyBlockInner(1, 5);
    engine.applyRemoteOperation({ kind: 'block', at: 0, removed: [], inserted: [p('top')] });
    expect(nAt(engine.document(), 2)).toBe(15);
    engine.undo();
    expect(nAt(engine.document(), 2)).toBe(10);
    expect(engine.document()).toHaveLength(4);
  });
});
