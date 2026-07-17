// @vitest-environment jsdom

import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { applyOp, diffDocuments, fragLen, invertOp } from './editor-transactions';
import { ASTDocument, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { BoldBehavior, HeadingBehavior, ImageBehavior, ParagraphBehavior } from './standard-behaviors';

const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const textOf = (doc: ASTDocument, i: number) => (doc[i].content as any[]).map((n) => n.text).join('');

describe('Invertible editor history', () => {
  let engine: EditorEngineService;

  const caret = (blockIndex: number, offset: number, inlineIndex = 0) => {
    engine.selection.live.set({
      start: { blockIndex, inlineIndex, offset },
      end: { blockIndex, inlineIndex, offset },
      isCollapsed: true,
    } as LogicalSelection);
  };
  const range = (from: [number, number, number], to: [number, number, number]) => {
    engine.selection.live.set({
      start: { blockIndex: from[0], inlineIndex: from[1], offset: from[2] },
      end: { blockIndex: to[0], inlineIndex: to[1], offset: to[2] },
      isCollapsed: false,
    } as LogicalSelection);
  };

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
      expect(engine.selection.active()?.start.offset).toBe(3);

      engine.redo();
      expect(textOf(engine.document(), 1)).toBe('twoX');
      expect(engine.selection.active()?.start.offset).toBe(4);
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
      const sel = engine.selection.active()!;
      expect(sel.start.offset).toBe(12);
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
      const sel = engine.selection.active()!;
      expect(sel.start.blockIndex).toBe(0);
      expect(sel.start.offset).toBe(8);
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
      const sel = engine.selection.active()!;
      expect(sel.start.blockIndex).toBe(1);
      expect(sel.start.offset).toBe(4);
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