// @vitest-environment jsdom

import { Injector, runInInjectionContext, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { EditorEngineService } from '../ship-editor/editor-engine.service';
import { BlockInnerOp, BlockSplice, EditorOp, applyOp, invertOp, registerBlockInnerAlgebra, transformOp } from '../ship-editor/editor-transactions';
import { ASTBlockNode, ASTDocument } from '../ship-editor/editor.types';
import { EditorSelectionService } from '../ship-editor/selection.service';
import { ParagraphBehavior } from '../ship-editor/standard-behaviors';
import { CollabMessage, CollabTransport } from '../ship-editor-collab/collab-protocol';
import { ShipEditorCollab } from '../ship-editor-collab/ship-editor-collab';
import { SheetModel, SheetOp, applySheetOps, createSheet, sheetFromJSON, sheetToJSON } from './core/sheet-model';
import { transformSheetOps } from './core/sheet-transform';
import { SHEET_INNER_ALGEBRA, ShipSpreadsheetBlockBehavior } from './ship-spreadsheet-block';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rnd = () => number;
const pick = (rnd: Rnd, n: number) => Math.floor(rnd() * n);

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const sheetBlock = (model: SheetModel): ASTBlockNode => ({ type: 'sheet', attrs: { ...sheetToJSON(model) }, content: [] });
const modelAt = (doc: ASTDocument, i: number) => sheetFromJSON(doc[i].attrs)!;
const inner = (blockIndex: number, ops: SheetOp[], inverse?: SheetOp[]): BlockInnerOp => ({ kind: 'block-inner', blockIndex, type: 'sheet', inner: ops, inverse });
const set = (row: number, col: number, v: string): SheetOp => ({ kind: 'set-cells', row, col, values: [[v]] });

let tag = 0;
function randomOps(rnd: Rnd, model: SheetModel): SheetOp[] {
  const ops: SheetOp[] = [];
  let current = model;
  const n = 1 + pick(rnd, 3);
  for (let i = 0; i < n; i++) {
    const t = ++tag;
    let op: SheetOp;
    const kind = current.rows === 0 || current.cols === 0 ? 1 : pick(rnd, 5);
    switch (kind) {
      case 0:
        op = set(pick(rnd, current.rows), pick(rnd, current.cols), `v${t}`);
        break;
      case 1:
        op = { kind: 'insert-rows', at: pick(rnd, current.rows + 1), count: 1 };
        break;
      case 2:
        op = { kind: 'remove-rows', at: pick(rnd, current.rows), count: 1 };
        break;
      case 3:
        op = { kind: 'insert-cols', at: pick(rnd, current.cols + 1), count: 1, types: [rnd() < 0.5 ? 'checkbox' : null] };
        break;
      default:
        op = { kind: 'set-col-width', col: pick(rnd, current.cols), width: 40 + t };
    }
    ops.push(op);
    current = applySheetOps(current, [op]).model;
  }
  return ops;
}

const base4: SheetModel = createSheet(3, 3, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
const BASE: ASTDocument = [p('intro'), sheetBlock(base4), p('outro')];

describe('sheet block-inner ops: transform', () => {
  registerBlockInnerAlgebra('sheet', SHEET_INNER_ALGEBRA);

  it('inner-vs-inner delegates to transformSheetOps and converges (fuzzed)', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const rnd = mulberry32(seed);
      const a = inner(1, randomOps(rnd, base4));
      const b = inner(1, randomOps(rnd, base4));
      const a2 = transformOp(a, b, 'left') as BlockInnerOp;
      const b2 = transformOp(b, a, 'right') as BlockInnerOp;
      expect(a2.inner).toEqual(transformSheetOps(a.inner as SheetOp[], b.inner as SheetOp[], 'left').ops);
      const viaA = modelAt(applyOp(applyOp(BASE, a), b2), 1);
      const viaB = modelAt(applyOp(applyOp(BASE, b), a2), 1);
      expect(viaA, `seed ${seed}`).toEqual(viaB);
    }
  });

  it('inner ops on different blocks or types do not interact', () => {
    const a = inner(1, [set(0, 0, 'x')]);
    const b = { ...inner(3, [set(0, 0, 'y')]) };
    expect(transformOp(a, b)).toBe(a);
    expect(transformOp(a, { ...b, blockIndex: 1, type: 'other' })).toBe(a);
  });

  it('inner-vs-splice: moved past an insert, dropped when its block is removed or replaced', () => {
    const op = inner(1, [set(0, 0, 'x')]);
    expect(transformOp(op, { kind: 'block', at: 0, removed: [], inserted: [p('1'), p('2')] })).toEqual({ ...op, blockIndex: 3 });
    expect(transformOp(op, { kind: 'block', at: 2, removed: [p('outro')], inserted: [] })).toBe(op);
    expect(transformOp(op, { kind: 'block', at: 1, removed: [sheetBlock(base4)], inserted: [] })).toBeNull();
    expect(transformOp(op, { kind: 'block', at: 0, removed: [p('intro'), sheetBlock(base4)], inserted: [p('merged')] })).toBeNull();
  });

  it('splice-vs-inner: a removed sheet block is patched so its re-insertion carries the peer edit', () => {
    const splice: BlockSplice = { kind: 'block', at: 1, removed: [sheetBlock(base4)], inserted: [] };
    const edit = inner(1, [set(2, 2, 'Z')]);
    const out = transformOp(splice, edit) as BlockSplice;
    expect(sheetFromJSON(out.removed[0].attrs)!.cells[8]).toBe('Z');
    const afterBoth = applyOp(applyOp(BASE, edit), out);
    expect(afterBoth).toHaveLength(2);
    expect(modelAt(applyOp(afterBoth, invertOp(out)), 1).cells[8]).toBe('Z');
  });

  it('invert: an applied inner op carries the exact sheet inverse', () => {
    const ops: SheetOp[] = [set(0, 0, 'X'), { kind: 'remove-rows', at: 1, count: 1 }];
    const inverse = SHEET_INNER_ALGEBRA.invert(ops, sheetToJSON(base4) as unknown as Record<string, unknown>);
    const op = inner(1, ops, inverse);
    const next = applyOp(BASE, op);
    expect(modelAt(next, 1).rows).toBe(2);
    expect(modelAt(applyOp(next, invertOp(op)), 1)).toEqual(base4);
  });
});

// --- Two peers, one page, one embedded sheet -------------------------------

class Hub {
  #subscribers: { id: string; cb: (m: CollabMessage) => void; queue: CollabMessage[] }[] = [];

  transport(id: string): CollabTransport {
    const hub = this;
    return {
      send(message) {
        for (const sub of hub.#subscribers) if (sub.id !== id) sub.queue.push(structuredClone(message));
      },
      subscribe(cb) {
        const entry = { id, cb, queue: [] as CollabMessage[] };
        hub.#subscribers.push(entry);
        return () => hub.#subscribers.splice(hub.#subscribers.indexOf(entry), 1);
      },
      connected: signal(true),
    };
  }

  flush() {
    for (let round = 0; round < 50; round++) {
      let delivered = false;
      for (const sub of this.#subscribers) {
        while (sub.queue.length) {
          delivered = true;
          sub.cb(sub.queue.shift()!);
        }
      }
      if (!delivered) return;
    }
  }

  deliverOne(id: string) {
    const sub = this.#subscribers.find((s) => s.id === id);
    const message = sub?.queue.shift();
    if (sub && message) sub.cb(message);
  }
}

function makeSite(hub: Hub, clientId: string, doc: ASTDocument) {
  const injector = Injector.create({ providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }] });
  const engine = runInInjectionContext(injector, () => new EditorEngineService());
  engine.register(new ParagraphBehavior());
  engine.register(new ShipSpreadsheetBlockBehavior());
  engine.load(structuredClone(doc));
  const collab = runInInjectionContext(injector, () => new ShipEditorCollab());
  collab.attach(engine, { transport: hub.transport(clientId), clientId, presenceThrottleMs: 0 });
  hub.flush();
  const sheetEdit = (blockIndex: number, ops: SheetOp[]) => {
    engine.applyBlockInner(blockIndex, ops);
    collab.flushLocal();
  };
  const sent: EditorOp[] = [];
  return { engine, collab, sheetEdit, sent };
}

const json = (engine: EditorEngineService) => JSON.stringify(engine.document());

describe('sheet block-inner ops: two peers converge', () => {
  it('concurrent cell edits in the same embedded sheet both survive', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', BASE);
    const b = makeSite(hub, 'bbb', BASE);

    a.sheetEdit(1, [set(0, 0, 'A')]);
    b.sheetEdit(1, [set(2, 2, 'B')]);
    hub.flush();

    expect(json(a.engine)).toBe(json(b.engine));
    const model = modelAt(a.engine.document(), 1);
    expect(model.cells[0]).toBe('A');
    expect(model.cells[8]).toBe('B');
  });

  it('a structural edit and a cell edit cross in flight', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', BASE);
    const b = makeSite(hub, 'bbb', BASE);

    a.sheetEdit(1, [{ kind: 'insert-rows', at: 0, count: 1 }]);
    b.sheetEdit(1, [set(1, 1, 'E!')]);
    hub.flush();

    expect(json(a.engine)).toBe(json(b.engine));
    const model = modelAt(a.engine.document(), 1);
    expect(model.rows).toBe(4);
    // B's edit to (1,1) followed the row it addressed.
    expect(model.cells[2 * 3 + 1]).toBe('E!');
  });

  it('a page edit above the sheet and a sheet edit cross in flight', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', BASE);
    const b = makeSite(hub, 'bbb', BASE);

    a.engine.selection.live.set({ from: 0, to: 0 });
    a.engine.insertText('X');
    a.collab.flushLocal();
    b.sheetEdit(1, [set(0, 0, 'S')]);
    hub.flush();

    expect(json(a.engine)).toBe(json(b.engine));
    expect(modelAt(a.engine.document(), 1).cells[0]).toBe('S');
  });

  it('undo of a local sheet edit after convergence keeps the peer edit', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', BASE);
    const b = makeSite(hub, 'bbb', BASE);

    a.sheetEdit(1, [set(0, 0, 'A')]);
    hub.flush();
    b.sheetEdit(1, [set(0, 1, 'B')]);
    hub.flush();
    a.engine.undo();
    a.collab.flushLocal();
    hub.flush();

    expect(json(a.engine)).toBe(json(b.engine));
    const model = modelAt(a.engine.document(), 1);
    expect(model.cells[0]).toBe('a');
    expect(model.cells[1]).toBe('B');
  });

  it('converges under randomized concurrent sheet edits with reordered delivery', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const rnd = mulberry32(seed);
      const hub = new Hub();
      const a = makeSite(hub, 'aaa', BASE);
      const b = makeSite(hub, 'bbb', BASE);
      const sites = [a, b];
      const ids = ['aaa', 'bbb'];
      for (let step = 0; step < 24; step++) {
        if (rnd() < 0.55) {
          const site = sites[pick(rnd, 2)];
          site.sheetEdit(1, randomOps(rnd, modelAt(site.engine.document(), 1)));
        } else {
          hub.deliverOne(ids[pick(rnd, 2)]);
        }
      }
      hub.flush();
      expect(json(a.engine), `seed ${seed}`).toBe(json(b.engine));
    }
  });
});
