// @vitest-environment jsdom
import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { applySplice, diffDocuments, invertSplice } from './editor-transactions';
import { ASTDocument, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { BoldBehavior, HeadingBehavior, ParagraphBehavior } from './standard-behaviors';

/**
 * Invertible (operation-based) history.
 *
 * The engine no longer snapshots the whole document per edit; every commit is a
 * minimal block splice with an exact inverse. These tests pin: splice
 * minimality, undo/redo round-trips across the edit kinds, redo invalidation,
 * reset/IME-commit invertibility, and that transactions stay plain JSON (the
 * future realtime-collab wire format).
 */

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
  /** Arrange a starting doc WITHOUT recording history (raw signal set). */
  const arrange = (doc: ASTDocument) => engine.document.set(doc);

  beforeEach(() => {
    // No TestBed (its environment isn't bootstrapped under vitest here) — build
    // the engine in a minimal injection context instead.
    const injector = Injector.create({
      providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
    });
    engine = runInInjectionContext(injector, () => new EditorEngineService());
    [new ParagraphBehavior(), new HeadingBehavior()].forEach((b) => engine.register(b));
    engine.register(new BoldBehavior());
  });

  describe('splice primitives', () => {
    it('diffs to the minimal splice (untouched blocks excluded)', () => {
      const oldDoc = [p('one'), p('two'), p('three')] as ASTDocument;
      const newDoc = [oldDoc[0], p('TWO!'), oldDoc[2]] as ASTDocument;
      const splice = diffDocuments(oldDoc, newDoc)!;
      expect(splice.at).toBe(1);
      expect(splice.removed).toHaveLength(1);
      expect(splice.inserted).toHaveLength(1);
      expect(textOf(splice.inserted as ASTDocument, 0)).toBe('TWO!');
    });

    it('returns null for identical documents', () => {
      const doc = [p('same')] as ASTDocument;
      expect(diffDocuments(doc, [...doc])).toBeNull();
      expect(diffDocuments(doc, [p('same')])).toBeNull(); // structural equality too
    });

    it('applySplice(invertSplice(s)) restores the original document', () => {
      const oldDoc = [p('a'), p('b'), p('c')] as ASTDocument;
      const newDoc = [p('a'), p('B1'), p('B2'), p('c')] as ASTDocument; // split-like change
      const splice = diffDocuments(oldDoc, newDoc)!;
      const forward = applySplice(oldDoc, splice);
      expect(JSON.stringify(forward)).toBe(JSON.stringify(newDoc));
      const back = applySplice(forward, invertSplice(splice));
      expect(JSON.stringify(back)).toBe(JSON.stringify(oldDoc));
    });
  });

  describe('engine transactions', () => {
    it('typing commits a single-block splice, and undo/redo round-trip text + selection', () => {
      arrange([p('one'), p('two'), p('three')]);
      caret(1, 3);
      engine.insertText('X');

      expect(textOf(engine.document(), 1)).toBe('twoX');
      const tx = engine.lastTransaction()!;
      expect(tx.splice.at).toBe(1);
      expect(tx.splice.removed).toHaveLength(1); // only the edited block is stored
      expect(tx.splice.inserted).toHaveLength(1);

      engine.undo();
      expect(textOf(engine.document(), 1)).toBe('two');
      expect(engine.document()).toHaveLength(3);
      expect(engine.selection.active()?.start.offset).toBe(3); // selBefore restored

      engine.redo();
      expect(textOf(engine.document(), 1)).toBe('twoX');
      expect(engine.selection.active()?.start.offset).toBe(4); // selAfter restored
    });

    it('Enter (block split) is invertible: 1 block -> 2 -> undo -> 1', () => {
      arrange([p('hello world')]);
      caret(0, 5);
      engine.handleEnter();
      expect(engine.document()).toHaveLength(2);
      expect(textOf(engine.document(), 0)).toBe('hello');
      expect(textOf(engine.document(), 1)).toBe(' world');
      const tx = engine.lastTransaction()!;
      expect(tx.splice.removed).toHaveLength(1);
      expect(tx.splice.inserted).toHaveLength(2);

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
      engine.insertText('c'); // abc
      engine.undo(); // ab
      expect(engine.canRedo()).toBe(true);
      caret(0, 2);
      engine.insertText('Z'); // abZ
      expect(engine.canRedo()).toBe(false);
      engine.redo(); // no-op
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
      // Simulate the post-composition reconcile: block 1 re-parsed from the DOM.
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
      engine.commitDocument([...engine.document()]); // identical content
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

    it('history is isolated from later mutations of the live document', () => {
      arrange([p('safe')]);
      caret(0, 4);
      engine.insertText('!');
      // Mutate the live doc's block in place (hostile/buggy consumer).
      (engine.document()[0].content as any[])[0].text = 'CORRUPTED';
      engine.undo();
      expect(textOf(engine.document(), 0)).toBe('safe'); // history untouched
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
      // Round-trips through JSON without loss — a peer could apply it verbatim.
      const wire = JSON.parse(JSON.stringify(tx));
      expect(wire).toEqual(tx);

      // A "remote peer" doc at the same base version applies the splice directly.
      const peerDoc = [p('a')] as ASTDocument;
      const peerAfter = applySplice(peerDoc, wire.splice);
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
  });
});
