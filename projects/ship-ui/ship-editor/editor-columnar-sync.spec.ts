// @vitest-environment jsdom

import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { fromColumnar, toColumnar } from './editor-columnar';
import { docSize } from './editor-flat-positions';
import { ASTBlockNode, ASTDocument, LogicalSelection } from './editor.types';
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

  const caret = (blockIndex: number, offset: number) =>
    engine.selection.live.set({
      start: { blockIndex, inlineIndex: 0, offset },
      end: { blockIndex, inlineIndex: 0, offset },
      isCollapsed: true,
    } as LogicalSelection);

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
