// @vitest-environment jsdom

import { Component, Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { logicalToPos } from './editor-flat-positions';
import { htmlToAst } from './editor-serializers';
import { ASTBlockNode, LogicalPosition } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { BaseComponentBlockBehavior } from './sh-editor-component-block';
import * as B from './standard-behaviors';

@Component({ standalone: true, template: '' })
class StubWidget {}

class WidgetBehavior extends BaseComponentBlockBehavior {
  readonly type = 'widget';
  readonly component = StubWidget;
}

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });

describe('BaseComponentBlockBehavior serialization', () => {
  const behavior = new WidgetBehavior();

  it('renders the neutral wrapper with JSON attrs', () => {
    const html = behavior.renderHTML({ type: 'widget', attrs: { src: 'https://x.test/v.mp4', volume: 0.5 }, content: [] });
    expect(html).toContain('data-sh-block="widget"');
    expect(html).toContain('contenteditable="false"');
    expect(html).toContain('data-sh-attrs=');
  });

  it('omits data-sh-attrs when there are no attrs', () => {
    expect(behavior.renderHTML({ type: 'widget', content: [] })).not.toContain('data-sh-attrs');
  });

  it('round-trips attrs through renderHTML → parseDOM, escaping included', () => {
    const attrs = { label: `<b>"quoted" & 'tricky'</b>`, count: 3, nested: { a: [1, 2] } };
    const html = behavior.renderHTML({ type: 'widget', attrs, content: [] });
    const host = document.createElement('div');
    host.innerHTML = html;
    const parsed = behavior.parseDOM(host.firstElementChild as HTMLElement);
    expect(parsed).toEqual({ type: 'widget', attrs, content: [] });
  });

  it('rejects foreign elements and malformed attr payloads', () => {
    const div = document.createElement('div');
    expect(behavior.parseDOM(div)).toBeNull();
    div.dataset['shBlock'] = 'other-widget';
    expect(behavior.parseDOM(div)).toBeNull();
    div.dataset['shBlock'] = 'widget';
    div.dataset['shAttrs'] = '{not json';
    expect(behavior.parseDOM(div)).toEqual({ type: 'widget', content: [] });
  });
});

describe('component blocks in the engine', () => {
  let engine: EditorEngineService;

  const caret = (blockIndex: number, offset: number) => {
    const at = logicalToPos(engine.document(), { blockIndex, inlineIndex: 0, offset } as LogicalPosition);
    engine.selection.live.set({ from: at, to: at });
  };

  beforeEach(() => {
    const injector = Injector.create({
      providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
    });
    engine = runInInjectionContext(injector, () => new EditorEngineService());
    [new B.ParagraphBehavior(), new B.HeadingBehavior(), new B.ImageBehavior(), new WidgetBehavior()].forEach((b) =>
      engine.register(b)
    );
  });

  it('insertVoidBlock inserts the block, selects it, and leaves a trailing paragraph', () => {
    engine.reset([p('hello')]);
    caret(0, 5);
    engine.insertVoidBlock('widget', { src: 'https://x.test' });
    const doc = engine.document();
    expect(doc.map((b) => b.type)).toEqual(['paragraph', 'widget', 'paragraph']);
    expect(doc[1].attrs).toEqual({ src: 'https://x.test' });
    expect(engine.selectedBlock()).toBe(1);
  });

  it('insertVoidBlock refuses non-void types', () => {
    engine.reset([p('hello')]);
    caret(0, 0);
    engine.insertVoidBlock('heading', {});
    expect(engine.document().map((b) => b.type)).toEqual(['paragraph']);
  });

  it('updateBlockAttrs merges attrs as one undoable transaction', () => {
    engine.reset([p('a'), { type: 'widget', attrs: { src: 'x', zoom: 1 }, content: [] }, p('b')]);
    caret(0, 0);
    engine.updateBlockAttrs(1, { zoom: 5 });
    expect(engine.document()[1].attrs).toEqual({ src: 'x', zoom: 5 });
    engine.undo();
    expect(engine.document()[1].attrs).toEqual({ src: 'x', zoom: 1 });
  });

  it('deleteBlock removes the block and clears its selection', () => {
    engine.reset([p('a'), { type: 'widget', content: [] }, p('b')]);
    caret(0, 0);
    engine.selectBlock(1);
    engine.deleteBlock(1);
    expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
    expect(engine.selectedBlock()).toBeNull();
  });

  it('serialize(html) → htmlToAst round-trips the block under the default sanitizer', () => {
    engine.reset([p('before'), { type: 'widget', attrs: { src: 'https://x.test' }, content: [] }, p('after')]);
    const html = engine.serialize('html') as string;
    const parsed = htmlToAst(html, engine.blocks, engine.inlines, true);
    expect(parsed.map((b) => b.type)).toEqual(['paragraph', 'widget', 'paragraph']);
    expect(parsed[1].attrs).toEqual({ src: 'https://x.test' });
  });

  it('a plain div still parses as a paragraph', () => {
    const parsed = htmlToAst('<div>plain</div>', engine.blocks, engine.inlines, true);
    expect(parsed.map((b) => b.type)).toEqual(['paragraph']);
  });
});
