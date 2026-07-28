// @vitest-environment jsdom

import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { fromColumnar, toColumnar } from './editor-columnar';
import { docSize, logicalToPos } from './editor-flat-positions';
import { ASTBlockNode, ASTDocument } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { BulletListBehavior, HeadingBehavior, ImageBehavior, ListItemBehavior, ParagraphBehavior } from './standard-behaviors';

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });

/**
 * The engine advances its columnar document by the op behind each change rather
 * than rebuilding it. If that ever diverges from the tree the drift is silent —
 * positions quietly point at the wrong places — so every mutation path is
 * checked against a fresh rebuild.
 */
describe('columnar stays in step with the document', () => {
  let engine: EditorEngineService;

  const caret = (blockIndex: number, offset: number) => {
    const at = logicalToPos(engine.document(), { blockIndex, inlineIndex: 0, offset });
    engine.selection.live.set({ from: at, to: at });
  };

  const expectInSync = (label: string) => {
    const live = engine.columnar;
    const rebuilt = toColumnar(engine.document());

    expect(live.rows, `${label}: rows`).toBe(rebuilt.rows);
    expect(live.size, `${label}: size`).toBe(rebuilt.size);
    expect(live.size, `${label}: size matches the tree`).toBe(docSize(engine.document()));
    for (let row = 0; row < rebuilt.rows; row++) {
      expect(live.typeOf(row), `${label}: type of row ${row}`).toBe(rebuilt.typeOf(row));
      expect(live.textOf(row), `${label}: text of row ${row}`).toBe(rebuilt.textOf(row));
      expect(live.startOf(row), `${label}: start of row ${row}`).toBe(rebuilt.startOf(row));
      expect(live.parentOf(row), `${label}: parent of row ${row}`).toBe(rebuilt.parentOf(row));
    }
    expect(fromColumnar(live), `${label}: round-trip`).toEqual(fromColumnar(rebuilt));
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

  it('starts in sync', () => {
    expectInSync('initial');
  });

  it('stays in sync while typing', () => {
    engine.reset([p('one'), p('two')]);
    expectInSync('after reset');

    caret(0, 3);
    engine.insertText('X');
    expectInSync('after insertText');

    caret(1, 0);
    engine.insertText('YZ');
    expectInSync('after second insertText');
  });

  it('stays in sync across Enter and Backspace', () => {
    engine.reset([p('hello world')]);
    caret(0, 5);
    engine.handleEnter();
    expectInSync('after Enter');

    caret(1, 0);
    engine.handleBackspace();
    expectInSync('after Backspace');
  });

  it('stays in sync through undo and redo', () => {
    engine.reset([p('alpha'), p('beta')]);
    caret(0, 5);
    engine.insertText('!');
    expectInSync('after edit');

    engine.undo();
    expectInSync('after undo');

    engine.redo();
    expectInSync('after redo');

    engine.undo();
    expectInSync('after second undo');
  });

  it('stays in sync when a block is added and removed', () => {
    engine.reset([p('a'), p('b')]);
    caret(0, 1);
    engine.handleEnter();
    expectInSync('after split');

    engine.undo();
    expectInSync('after undoing the split');
  });

  it('stays in sync with containers in the document', () => {
    engine.reset([
      p('before'),
      { type: 'bullet-list', content: [
        { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
        { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
      ] },
      p('after'),
    ] as ASTDocument);
    expectInSync('with a list');

    caret(2, 5);
    engine.insertText('!');
    expectInSync('after editing past the list');
  });

  it('stays in sync when a fragment is pasted', () => {
    engine.reset([p('ab')]);
    caret(0, 1);
    engine.insertFragment([p('one'), p('two')]);
    expectInSync('after pasting text blocks');

    caret(0, 0);
    engine.insertFragment([
      { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'x' }] }] },
    ] as ASTDocument);
    expectInSync('after pasting a list');
  });

  it('stays in sync while typing into marked text', () => {
    engine.reset([
      { type: 'paragraph', content: [
        { type: 'text', text: 'plain ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' tail' },
      ] },
    ] as ASTDocument);

    caret(0, 8); // inside the bold run
    engine.insertText('X');
    expectInSync('after typing inside a bold run');

    caret(0, 6); // at the run's left boundary
    engine.insertText('Y');
    expectInSync('after typing at the bold run boundary');

    engine.undo();
    expectInSync('after undoing marked typing');
  });

  it('stays in sync when pending marks land at the caret', () => {
    engine.reset([p('hello')]);
    caret(0, 5);
    engine.insertTextWithMarks('!', [{ type: 'bold' }]);
    expectInSync('after inserting text with staged marks');
  });

  it('stays in sync through a cross-block range delete into a list', () => {
    engine.reset([
      p('before'),
      { type: 'bullet-list', content: [
        { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
        { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
      ] },
      p('after'),
    ] as ASTDocument);

    const doc = engine.document();
    const from = logicalToPos(doc, { blockIndex: 0, inlineIndex: 0, offset: 3 });
    const to = logicalToPos(doc, { blockIndex: 1, itemIndex: 0, inlineIndex: 0, offset: 2 });
    engine.selection.live.set({ from, to });
    engine.deleteRange();
    expectInSync('after deleting across into the list');

    engine.undo();
    expectInSync('after undoing the cross-block delete');
  });

  it('stays in sync through setBlockType and toggleMark', () => {
    engine.reset([p('title'), p('body text')]);
    caret(0, 0);
    engine.setBlockType('heading', { level: 2 });
    expectInSync('after setBlockType');

    const doc = engine.document();
    engine.selection.live.set({
      from: logicalToPos(doc, { blockIndex: 1, inlineIndex: 0, offset: 0 }),
      to: logicalToPos(doc, { blockIndex: 1, inlineIndex: 0, offset: 4 }),
    });
    engine.toggleMark('bold');
    expectInSync('after toggling bold on');
    engine.undo();
    expectInSync('after undoing the mark');
  });

  it('stays in sync when a remote marked insert lands inside a marked run', () => {
    engine.reset([
      { type: 'paragraph', content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] },
    ] as ASTDocument);

    engine.applyRemoteOperation({
      kind: 'inline',
      blockIndex: 0,
      at: 2,
      removed: [],
      inserted: [{ type: 'text', text: 'X', marks: [{ type: 'bold' }] }],
    });
    expectInSync('after a remote marked insert mid-run');
  });

  it('stays in sync when a remote op removes a block before a list', () => {
    engine.reset([
      p('gone'),
      { type: 'bullet-list', content: [
        { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
        { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
      ] },
    ] as ASTDocument);

    engine.applyRemoteOperation({ kind: 'block', at: 0, removed: [p('gone')], inserted: [] });
    expectInSync('after a remote removal before a container');
  });

  it('stays in sync after a remote operation', () => {
    engine.reset([p('one'), p('two'), p('three')]);
    engine.applyRemoteOperation({
      kind: 'inline',
      blockIndex: 1,
      at: 3,
      removed: [],
      inserted: [{ type: 'text', text: 'REMOTE' }],
    });
    expectInSync('after a remote inline op');

    engine.applyRemoteOperation({ kind: 'block', at: 1, removed: [], inserted: [p('inserted')] });
    expectInSync('after a remote block op');
  });

  it('stays in sync across a long mixed sequence', () => {
    engine.reset([p('one'), p('two'), p('three')]);
    for (let i = 0; i < 12; i++) {
      caret(i % engine.document().length, 0);
      engine.insertText(`${i}`);
      if (i % 3 === 0) {
        caret(0, 1);
        engine.handleEnter();
      }
      if (i % 4 === 0) engine.undo();
    }
    expectInSync('after a mixed sequence');
  });
});
