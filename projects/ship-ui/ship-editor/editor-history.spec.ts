// @vitest-environment jsdom

import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { logicalToPos, posToLogical } from './editor-flat-positions';
import { applyOp, diffDocuments, fragLen, invertOp } from './editor-transactions';
import { ASTBlockNode, ASTDocument, LogicalPosition } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { BoldBehavior, BulletListBehavior, HeadingBehavior, ImageBehavior, ListItemBehavior, ParagraphBehavior } from './standard-behaviors';

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const textOf = (doc: ASTDocument, i: number) => (doc[i].content as any[]).map((n) => n.text).join('');

describe('Invertible editor history', () => {
  let engine: EditorEngineService;

  // Selections are flat; tests are written in tree coordinates and convert.
  const flat = (pos: Partial<LogicalPosition> & { blockIndex: number; offset: number }) =>
    logicalToPos(engine.document(), { inlineIndex: 0, ...pos });
  const caret = (blockIndex: number, offset: number, inlineIndex = 0) => {
    const at = flat({ blockIndex, inlineIndex, offset });
    engine.selection.live.set({ from: at, to: at });
  };
  const range = (from: [number, number, number], to: [number, number, number]) => {
    engine.selection.live.set({
      from: flat({ blockIndex: from[0], inlineIndex: from[1], offset: from[2] }),
      to: flat({ blockIndex: to[0], inlineIndex: to[1], offset: to[2] }),
    });
  };
  /** Tree-shaped view of the live caret, for assertions written in tree coordinates. */
  const caretLp = () => posToLogical(engine.document(), engine.selection.active()!.from)!;

  const arrange = (doc: ASTDocument) => engine.document.set(doc);

  beforeEach(() => {

    const injector = Injector.create({
      providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
    });
    engine = runInInjectionContext(injector, () => new EditorEngineService());
    [new ParagraphBehavior(), new HeadingBehavior(), new ImageBehavior()].forEach((b) => engine.register(b));
    engine.register(new BoldBehavior());
  });

  describe('op primitives', () => {
    it('refines a single-text-block change to a char-level inline op', () => {
      const oldDoc = [p('one'), p('two'), p('three')] as ASTDocument;
      const newDoc = [oldDoc[0], p('TWO!'), oldDoc[2]] as ASTDocument;
      const op = diffDocuments(oldDoc, newDoc)!;
      expect(op.kind).toBe('inline');
      if (op.kind !== 'inline') return;
      expect(op.blockIndex).toBe(1);
      expect(op.at).toBe(0);
      expect(op.removed.map((n) => n.text).join('')).toBe('two');
      expect(op.inserted.map((n) => n.text).join('')).toBe('TWO!');
    });

    it('returns null for identical documents', () => {
      const doc = [p('same')] as ASTDocument;
      expect(diffDocuments(doc, [...doc])).toBeNull();
      expect(diffDocuments(doc, [p('same')])).toBeNull();
    });

    it('applyOp(invertOp(op)) restores the original document (block op)', () => {
      const oldDoc = [p('a'), p('b'), p('c')] as ASTDocument;
      const newDoc = [p('a'), p('B1'), p('B2'), p('c')] as ASTDocument;
      const op = diffDocuments(oldDoc, newDoc)!;
      expect(op.kind).toBe('block');
      const forward = applyOp(oldDoc, op);
      expect(JSON.stringify(forward)).toBe(JSON.stringify(newDoc));
      const back = applyOp(forward, invertOp(op));
      expect(JSON.stringify(back)).toBe(JSON.stringify(oldDoc));
    });
  });

  describe('document immutability across edits', () => {
    // insertText path-copies rather than deep-cloning the document, so the
    // previous document must still be observably untouched — the undo stack and
    // the last emitted value both hold references to it.
    it('leaves the previous document untouched when typing', () => {
      const before: ASTDocument = [p('one'), p('two'), p('three')];
      arrange(before);
      const snapshot = JSON.parse(JSON.stringify(before));

      caret(1, 3);
      engine.insertText('X');

      expect(textOf(engine.document(), 1)).toBe('twoX');
      // The array we handed in, and every node reachable from it, is unchanged.
      expect(before).toEqual(snapshot);
    });

    it('shares untouched blocks by reference instead of copying them', () => {
      const before: ASTDocument = [p('one'), p('two'), p('three')];
      arrange(before);
      caret(1, 3);
      engine.insertText('X');

      const after = engine.document();
      expect(after[0]).toBe(before[0]);
      expect(after[2]).toBe(before[2]);
      expect(after[1]).not.toBe(before[1]);
    });

    it('does not corrupt the previous document when typing repeatedly', () => {
      arrange([p('one'), p('two')]);
      const original = engine.document();
      const snapshot = JSON.parse(JSON.stringify(original));

      caret(1, 3);
      engine.insertText('a');
      caret(1, 4);
      engine.insertText('b');
      caret(1, 5);
      engine.insertText('c');

      expect(textOf(engine.document(), 1)).toBe('twoabc');
      expect(original).toEqual(snapshot);

      engine.undo();
      engine.undo();
      engine.undo();
      expect(textOf(engine.document(), 1)).toBe('two');
    });

    it('keeps marks isolated when typing inside a marked run', () => {
      const marked: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] },
      ];
      arrange(marked);
      const snapshot = JSON.parse(JSON.stringify(marked));

      caret(0, 2);
      engine.insertText('X');

      expect(textOf(engine.document(), 0)).toBe('boXld');
      expect(marked).toEqual(snapshot);
      // The mutated node must not share its marks array with the original.
      const nextNode = (engine.document()[0].content as any[])[0];
      const prevNode = (marked[0].content as any[])[0];
      expect(nextNode.marks).not.toBe(prevNode.marks);
      expect(nextNode.marks).toEqual(prevNode.marks);
    });
  });

  describe('engine transactions', () => {
    it('typing commits a char-level op, and undo/redo round-trip text + selection', () => {
      arrange([p('one'), p('two'), p('three')]);
      caret(1, 3);
      engine.insertText('X');

      expect(textOf(engine.document(), 1)).toBe('twoX');
      const tx = engine.lastTransaction()!;
      expect(tx.op.kind).toBe('inline');
      if (tx.op.kind === 'inline') {
        expect(tx.op.blockIndex).toBe(1);
        expect(tx.op.at).toBe(3);
        expect(fragLen(tx.op.removed)).toBe(0);
        expect(tx.op.inserted.map((n) => n.text).join('')).toBe('X');
      }

      engine.undo();
      expect(textOf(engine.document(), 1)).toBe('two');
      expect(engine.document()).toHaveLength(3);
      expect(caretLp().offset).toBe(3);

      engine.redo();
      expect(textOf(engine.document(), 1)).toBe('twoX');
      expect(caretLp().offset).toBe(4);
    });

    it('Enter (block split) is invertible: 1 block -> 2 -> undo -> 1', () => {
      arrange([p('hello world')]);
      caret(0, 5);
      engine.handleEnter();
      expect(engine.document()).toHaveLength(2);
      expect(textOf(engine.document(), 0)).toBe('hello');
      expect(textOf(engine.document(), 1)).toBe(' world');
      const tx = engine.lastTransaction()!;
      expect(tx.op.kind).toBe('block');
      if (tx.op.kind === 'block') {
        expect(tx.op.removed).toHaveLength(1);
        expect(tx.op.inserted).toHaveLength(2);
      }

      engine.undo();
      expect(engine.document()).toHaveLength(1);
      expect(textOf(engine.document(), 0)).toBe('hello world');

      engine.redo();
      expect(engine.document()).toHaveLength(2);
    });

    it('a cross-block range delete is restored whole by undo', () => {
      arrange([p('alpha'), p('beta'), p('gamma')]);
      range([0, 0, 2], [2, 0, 3]);
      engine.deleteRange();
      expect(engine.document().length).toBeLessThan(3);

      engine.undo();
      expect(engine.document()).toHaveLength(3);
      expect(textOf(engine.document(), 0)).toBe('alpha');
      expect(textOf(engine.document(), 1)).toBe('beta');
      expect(textOf(engine.document(), 2)).toBe('gamma');
    });

    it('toggleMark is invertible', () => {
      arrange([p('bold me')]);
      range([0, 0, 0], [0, 0, 4]);
      engine.toggleMark('bold');
      const marked = engine.document()[0].content as any[];
      expect(marked.some((n) => n.marks?.some((m: any) => m.type === 'bold'))).toBe(true);

      engine.undo();
      const unmarked = engine.document()[0].content as any[];
      expect(unmarked.some((n) => n.marks?.some((m: any) => m.type === 'bold'))).toBe(false);
    });

    it('a new edit after undo clears the redo stack', () => {
      arrange([p('ab')]);
      caret(0, 2);
      engine.insertText('c');
      engine.undo();
      expect(engine.canRedo()).toBe(true);
      caret(0, 2);
      engine.insertText('Z');
      expect(engine.canRedo()).toBe(false);
      engine.redo();
      expect(textOf(engine.document(), 0)).toBe('abZ');
    });

    it('reset (external value) is itself invertible', () => {
      arrange([p('original')]);
      engine.reset([p('replaced'), p('content')]);
      expect(engine.document()).toHaveLength(2);

      engine.undo();
      expect(engine.document()).toHaveLength(1);
      expect(textOf(engine.document(), 0)).toBe('original');
    });

    it('commitDocument (IME reconcile path) records an undoable transaction', () => {
      arrange([p('hello'), p('world')]);
      caret(1, 5);

      const doc = [...engine.document()];
      doc[1] = p('world你好');
      engine.commitDocument(doc);
      expect(textOf(engine.document(), 1)).toBe('world你好');

      engine.undo();
      expect(textOf(engine.document(), 1)).toBe('world');
      engine.redo();
      expect(textOf(engine.document(), 1)).toBe('world你好');
    });

    it('a no-op mutation records nothing', () => {
      arrange([p('static')]);
      engine.commitDocument([...engine.document()]);
      expect(engine.canUndo()).toBe(false);
      expect(engine.lastTransaction()).toBeNull();
    });

    it('canUndo/canRedo are live signals', () => {
      arrange([p('x')]);
      expect(engine.canUndo()).toBe(false);
      expect(engine.canRedo()).toBe(false);
      caret(0, 1);
      engine.insertText('y');
      expect(engine.canUndo()).toBe(true);
      engine.undo();
      expect(engine.canUndo()).toBe(false);
      expect(engine.canRedo()).toBe(true);
    });

    it('stored op fragments are isolated from later mutations of the live document', () => {

      arrange([p('safe')]);
      caret(0, 4);
      engine.insertText('!');
      (engine.document()[0].content as any[])[0].text = 'CORRUPTED';
      const tx = engine.lastTransaction()!;
      expect(tx.op.kind).toBe('inline');
      if (tx.op.kind === 'inline') {
        expect(tx.op.inserted.map((n) => n.text).join('')).toBe('!');
        expect(fragLen(tx.op.removed)).toBe(0);
      }
    });
  });

  describe('collab-readiness', () => {
    it('transactions are plain JSON (wire-serializable) and versioned', () => {
      arrange([p('a')]);
      const v0 = engine.version();
      caret(0, 1);
      engine.insertText('b');
      const tx = engine.lastTransaction()!;
      expect(tx.baseVersion).toBe(v0);
      expect(engine.version()).toBe(v0 + 1);

      const wire = JSON.parse(JSON.stringify(tx));
      expect(wire).toEqual(tx);

      const peerDoc = [p('a')] as ASTDocument;
      const peerAfter = applyOp(peerDoc, wire.op);
      expect(JSON.stringify(peerAfter)).toBe(JSON.stringify(engine.document()));
    });

    it('undo/redo advance the version (they are transactions too)', () => {
      arrange([p('a')]);
      caret(0, 1);
      engine.insertText('b');
      const v = engine.version();
      engine.undo();
      expect(engine.version()).toBe(v + 1);
      engine.redo();
      expect(engine.version()).toBe(v + 2);
    });

    it('applyRemoteOperation applies without entering local undo history', () => {
      arrange([p('local')]);
      expect(engine.canUndo()).toBe(false);
      engine.applyRemoteOperation({
        kind: 'inline',
        blockIndex: 0,
        at: 5,
        removed: [],
        inserted: [{ type: 'text', text: ' [peer]' }],
      });
      expect(textOf(engine.document(), 0)).toBe('local [peer]');
      expect(engine.canUndo()).toBe(false);
    });

    it('a remote op rebases pending local history so undo still hits the right text', () => {
      arrange([p('hello world')]);
      caret(0, 11);
      engine.insertText('!');

      engine.applyRemoteOperation({
        kind: 'inline',
        blockIndex: 0,
        at: 0,
        removed: [],
        inserted: [{ type: 'text', text: '>>>>> ' }],
      });
      expect(textOf(engine.document(), 0)).toBe('>>>>> hello world!');

      engine.undo();
      expect(textOf(engine.document(), 0)).toBe('>>>>> hello world');
    });

    it('maps the live caret through a remote edit (no caret jump)', () => {
      arrange([p('hello world')]);
      caret(0, 8);
      engine.applyRemoteOperation({
        kind: 'inline',
        blockIndex: 0,
        at: 0,
        removed: [],
        inserted: [{ type: 'text', text: '>>> ' }],
      });
      expect(caretLp().offset).toBe(12);
    });

    it('maps the caret EXACTLY through a remote coarse block merge', () => {

      arrange([p('hello'), p('world')]);
      caret(1, 3);
      engine.applyRemoteOperation({
        kind: 'block',
        at: 0,
        removed: [p('hello'), p('world')],
        inserted: [p('helloworld')],
      });
      const lp = caretLp();
      expect(lp.blockIndex).toBe(0);
      expect(lp.offset).toBe(8);
    });

    it('tie regression: remote insert at the offset of a pending local char — undo removes the LOCAL one', () => {
      arrange([p('..')]);
      caret(0, 1);
      engine.insertText('a');
      engine.applyRemoteOperation({
        kind: 'inline',
        blockIndex: 0,
        at: 1,
        removed: [],
        inserted: [{ type: 'text', text: 'B' }],
      });
      expect(textOf(engine.document(), 0)).toBe('.Ba.');
      engine.undo();
      expect(textOf(engine.document(), 0)).toBe('.B.');
    });

    it('rebases stored caret snapshots: undo after a remote edit restores the MAPPED caret', () => {

      arrange([p('....'), p('....')]);
      caret(1, 2);
      engine.insertText('a');
      engine.applyRemoteOperation({
        kind: 'inline',
        blockIndex: 1,
        at: 0,
        removed: [],
        inserted: [{ type: 'text', text: 'RR' }],
      });
      expect(textOf(engine.document(), 1)).toBe('RR..a..');
      engine.undo();
      expect(textOf(engine.document(), 1)).toBe('RR....');
      const lp = caretLp();
      expect(lp.blockIndex).toBe(1);
      expect(lp.offset).toBe(4);
    });

    it('a remote op that destroys a pending edit target drops that history entry', () => {
      arrange([p('abc'), p('target')]);
      caret(1, 6);
      engine.insertText('!');
      expect(engine.canUndo()).toBe(true);

      engine.applyRemoteOperation({
        kind: 'block',
        at: 1,
        removed: [p('target!')],
        inserted: [p('REPLACED')],
      });
      expect(engine.canUndo()).toBe(false);
      expect(textOf(engine.document(), 1)).toBe('REPLACED');
    });

    it('rebases the selected image index when a peer inserts a block above it', () => {
      const img = { type: 'image', attrs: { src: 'https://x.example/a.png', mode: 'content', size: 'auto' }, content: [] };
      arrange([p('above'), img, p('below')]);
      engine.selectBlock(1);
      expect(engine.selectedBlock()).toBe(1);

      engine.applyRemoteOperation({ kind: 'block', at: 0, removed: [], inserted: [p('peer')] });
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'paragraph', 'image', 'paragraph']);
      expect(engine.selectedBlock()).toBe(2);
    });

    it('clears the selected image when a peer deletes that block', () => {
      const img = { type: 'image', attrs: { src: 'https://x.example/a.png', mode: 'content', size: 'auto' }, content: [] };
      arrange([p('above'), img, p('below')]);
      engine.selectBlock(1);

      engine.applyRemoteOperation({ kind: 'block', at: 1, removed: [img], inserted: [] });
      expect(engine.document().some((b) => b.type === 'image')).toBe(false);
      expect(engine.selectedBlock()).toBeNull();
    });
  });
});
describe('pasting a fragment that contains containers', () => {
  let engine: EditorEngineService;

  const caret = (blockIndex: number, offset: number, extra: Record<string, unknown> = {}) => {
    const at = logicalToPos(engine.document(), { blockIndex, inlineIndex: 0, offset, ...extra } as LogicalPosition);
    engine.selection.live.set({ from: at, to: at });
  };

  const ul = (...texts: string[]): ASTBlockNode => ({
    type: 'bullet-list',
    content: texts.map((t) => ({ type: 'list-item', content: [{ type: 'text', text: t }] })),
  });

  beforeEach(() => {
    const injector = Injector.create({
      providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
    });
    engine = runInInjectionContext(injector, () => new EditorEngineService());
    [new ParagraphBehavior(), new HeadingBehavior(), new ImageBehavior()].forEach((b) => engine.register(b));
    engine.register(new BulletListBehavior());
    engine.register(new ListItemBehavior());
  });

  // A pasted list is a container: its content holds list-item blocks, not inline
  // nodes. The merge path assumed inline content throughout and read `.text` off
  // a block node, which threw "Cannot read properties of undefined".
  it('pastes a list into an empty paragraph without throwing', () => {
    engine.document.set([p('')]);
    caret(0, 0);

    expect(() => engine.insertFragment([ul('one', 'two')])).not.toThrow();

    const doc = engine.document();
    expect(doc.some((b) => b.type === 'bullet-list')).toBe(true);
    const list = doc.find((b) => b.type === 'bullet-list')!;
    expect((list.content as ASTBlockNode[]).map((li) => (li.content as any[])[0].text)).toEqual(['one', 'two']);
  });

  it('splits the target paragraph around a pasted list', () => {
    engine.document.set([p('beforeafter')]);
    caret(0, 6);

    engine.insertFragment([ul('item')]);

    const doc = engine.document();
    expect(doc.map((b) => b.type)).toEqual(['paragraph', 'bullet-list', 'paragraph']);
    expect(textOf(doc, 0)).toBe('before');
    expect(textOf(doc, 2)).toBe('after');
  });

  it('keeps text before the caret when pasting a list at the end of a paragraph', () => {
    engine.document.set([p('keep')]);
    caret(0, 4);

    engine.insertFragment([ul('x')]);

    const doc = engine.document();
    expect(doc.map((b) => b.type)).toEqual(['paragraph', 'bullet-list']);
    expect(textOf(doc, 0)).toBe('keep');
  });

  it('pastes a mixed fragment of paragraph, list and paragraph', () => {
    engine.document.set([p('ab')]);
    caret(0, 1);

    engine.insertFragment([p('one'), ul('bullet'), p('two')]);

    const doc = engine.document();
    expect(doc.map((b) => b.type)).toEqual(['paragraph', 'paragraph', 'bullet-list', 'paragraph', 'paragraph']);
    expect(textOf(doc, 0)).toBe('a');
    expect(textOf(doc, 4)).toBe('b');
  });

  it('still merges a plain text fragment inline, rather than splitting', () => {
    engine.document.set([p('ac')]);
    caret(0, 1);

    engine.insertFragment([p('b')]);

    const doc = engine.document();
    expect(doc).toHaveLength(1);
    expect(textOf(doc, 0)).toBe('abc');
  });

  it('undoes a list paste back to the original document', () => {
    engine.document.set([p('start')]);
    caret(0, 5);
    engine.insertFragment([ul('one')]);
    expect(engine.document().length).toBeGreaterThan(1);

    engine.undo();
    expect(engine.document()).toHaveLength(1);
    expect(textOf(engine.document(), 0)).toBe('start');
  });
});

describe('pasting into a list item', () => {
  let engine: EditorEngineService;

  const ul = (...texts: string[]): ASTBlockNode => ({
    type: 'bullet-list',
    content: texts.map((t) => ({ type: 'list-item', content: [{ type: 'text', text: t }] })),
  });
  const itemTexts = (block: ASTBlockNode) =>
    (block.content as ASTBlockNode[]).map((li) => (li.content as any[]).map((n) => n.text).join(''));

  const caretInItem = (blockIndex: number, itemIndex: number, offset: number) => {
    const at = logicalToPos(engine.document(), { blockIndex, itemIndex, inlineIndex: 0, offset });
    engine.selection.live.set({ from: at, to: at });
  };

  beforeEach(() => {
    const injector = Injector.create({
      providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
    });
    engine = runInInjectionContext(injector, () => new EditorEngineService());
    [new ParagraphBehavior(), new HeadingBehavior(), new ImageBehavior()].forEach((b) => engine.register(b));
    engine.register(new BulletListBehavior());
    engine.register(new ListItemBehavior());
  });

  // normalizeInlineNodes merges runs with `last.text += node.text`. Feeding it
  // block nodes made that undefined + undefined, so the item's text became the
  // string "NaN" — corrupt content rather than a crash.
  it('never produces NaN text when a list is pasted into a list item', () => {
    engine.document.set([ul('target')]);
    caretInItem(0, 0, 6);

    engine.insertFragment([ul('one', 'two')]);

    const texts = itemTexts(engine.document()[0]);
    for (const t of texts) {
      expect(t, `item text: ${t}`).not.toContain('NaN');
      expect(typeof t).toBe('string');
    }
  });

  it('flattens a pasted list into the target list rather than nesting it', () => {
    engine.document.set([ul('a', 'b')]);
    caretInItem(0, 0, 1);

    engine.insertFragment([ul('X', 'Y')]);

    const doc = engine.document();
    expect(doc).toHaveLength(1);
    expect(doc[0].type).toBe('bullet-list');
    expect(itemTexts(doc[0]).join('|')).not.toContain('NaN');
    // The pasted items land inside the target list, not as a nested one.
    expect((doc[0].content as ASTBlockNode[]).every((li) => li.type === 'list-item')).toBe(true);
  });

  it('survives repeated pastes into the same list without corrupting text', () => {
    engine.document.set([ul('seed')]);
    for (let i = 0; i < 10; i++) {
      caretInItem(0, 0, 0);
      engine.insertFragment([ul(`p${i}`)]);
    }
    const texts = itemTexts(engine.document()[0]);
    expect(texts.join('|')).not.toContain('NaN');
    expect(texts.every((t) => typeof t === 'string')).toBe(true);
  });

  it('still pastes plain text into a list item inline', () => {
    engine.document.set([ul('ac')]);
    caretInItem(0, 0, 1);

    engine.insertFragment([p('b')]);

    expect(itemTexts(engine.document()[0])[0]).toBe('abc');
  });
});
