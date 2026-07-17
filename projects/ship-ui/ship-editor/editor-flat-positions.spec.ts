// @vitest-environment jsdom

import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { StepMap, diffFlat, docSize, logicalToPos, nodeSize, posToLogical, stepMapFromOp } from './editor-flat-positions';
import { ASTDocument, LogicalPosition } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { ParagraphBehavior } from './standard-behaviors';

const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const li = (text: string) => ({ type: 'list-item', content: [{ type: 'text', text }] });
const ul = (...items: any[]) => ({ type: 'bullet-list', content: items });
const hr = () => ({ type: 'hr', content: [] });
const lp = (blockIndex: number, offset: number, extra: Partial<LogicalPosition> = {}): LogicalPosition =>
  ({ blockIndex, inlineIndex: 0, offset, ...extra }) as LogicalPosition;

function charAt(doc: ASTDocument, pos: LogicalPosition): string {
  const block = doc[pos.blockIndex];
  const content = (pos.itemIndex !== undefined ? (block.content as any[])[pos.itemIndex].content : block.content) as any[];
  let off = pos.offset;
  for (let i = 0; i < pos.inlineIndex; i++) off += content[i].text.length;
  return content.map((n) => n.text).join('')[off] ?? '<end>';
}

describe('flat position space', () => {
  it('nodeSize/docSize: text, container, void', () => {
    expect(nodeSize(p('ab') as any)).toBe(4);
    expect(nodeSize(hr() as any)).toBe(1);
    expect(nodeSize(ul(li('cd')) as any)).toBe(6);
    expect(docSize([p('ab'), hr(), ul(li('cd'))] as ASTDocument)).toBe(11);
  });

  it('logicalToPos matches the token diagram', () => {
    const doc = [p('ab'), ul(li('cd'))] as ASTDocument;

    expect(logicalToPos(doc, lp(0, 0))).toBe(1);
    expect(logicalToPos(doc, lp(0, 2))).toBe(3);
    expect(logicalToPos(doc, lp(1, 1, { itemIndex: 0 }))).toBe(7);
  });

  it('logical ↔ flat round-trips across blocks, items, and run boundaries', () => {
    const doc = [
      { type: 'paragraph', content: [{ type: 'text', text: 'ab' }, { type: 'text', text: 'cd', marks: [{ type: 'bold' }] }] },
      hr(),
      ul(li('one'), li('two')),
    ] as ASTDocument;
    const carets: LogicalPosition[] = [
      lp(0, 0),
      lp(0, 2),
      lp(0, 1, { inlineIndex: 1 }),
      lp(2, 0, { itemIndex: 0 }),
      lp(2, 3, { itemIndex: 1 }),
    ];
    for (const c of carets) {
      const back = posToLogical(doc, logicalToPos(doc, c))!;

      expect(logicalToPos(doc, back), JSON.stringify(c)).toBe(logicalToPos(doc, c));
      expect(charAt(doc, back)).toBe(charAt(doc, c));
    }
  });

  it('StepMap: before/inside/after, assoc tie-break, invert, deleted flag', () => {
    const map = new StepMap([[5, 2, 6]]);
    expect(map.map(3)).toBe(3);
    expect(map.map(9)).toBe(13);
    expect(map.map(6)).toBe(11);
    expect(map.map(6, -1)).toBe(5);
    expect(map.mapResult(6).deleted).toBe(true);
    expect(map.mapResult(5).deleted).toBe(false);
    const insert = new StepMap([[4, 0, 3]]);
    expect(insert.map(4, -1)).toBe(4);
    expect(insert.map(4, 1)).toBe(7);
    expect(insert.invert().map(7)).toBe(4);
  });
});

describe('ACCEPTANCE: backspace-merge cursor mapping', () => {
  let engine: EditorEngineService;

  beforeEach(() => {
    const injector = Injector.create({
      providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
    });
    engine = runInInjectionContext(injector, () => new EditorEngineService());
    engine.register(new ParagraphBehavior());
  });

  it('a cursor in block 2 lands on the SAME character after a real backspace merge', () => {
    const oldDoc = [p('hello'), p('world')] as ASTDocument;
    engine.document.set(oldDoc);

    const bystander = lp(1, 3);
    expect(charAt(oldDoc, bystander)).toBe('l');
    const flatBefore = logicalToPos(oldDoc, bystander);

    engine.selection.live.set({ start: lp(1, 0), end: lp(1, 0), isCollapsed: true } as any);
    engine.handleBackspace();
    const newDoc = engine.document();
    expect(newDoc).toHaveLength(1);
    expect((newDoc[0].content as any[]).map((n) => n.text).join('')).toBe('helloworld');

    const map = diffFlat(oldDoc, newDoc)!;
    expect(map.ranges).toEqual([[6, 2, 0]]);

    const mapped = posToLogical(newDoc, map.map(flatBefore))!;
    expect(mapped.blockIndex).toBe(0);
    expect(mapped.offset).toBe(8);
    expect(charAt(newDoc, mapped)).toBe('l');

    const restored = posToLogical(oldDoc, map.invert().map(logicalToPos(newDoc, mapped)))!;
    expect(logicalToPos(oldDoc, restored)).toBe(flatBefore);
  });

  it('CONTRAST: the typed BlockSplice for the same merge cannot recover the cursor', () => {
    const oldDoc = [p('hello'), p('world')] as ASTDocument;
    engine.document.set(oldDoc);
    engine.selection.live.set({ start: lp(1, 0), end: lp(1, 0), isCollapsed: true } as any);
    engine.handleBackspace();

    const tx = engine.lastTransaction()!;
    expect(tx.op.kind).toBe('block');
    const spliceMap = stepMapFromOp(oldDoc, tx.op as any);

    const flatBefore = logicalToPos(oldDoc, lp(1, 3));
    const exact = logicalToPos(engine.document(), lp(0, 8));

    const coarse = spliceMap.map(flatBefore, -1);
    expect(spliceMap.mapResult(flatBefore).deleted).toBe(true);
    expect(coarse).not.toBe(exact);
  });

  it('Enter (split) maps a trailing cursor into the new block', () => {
    const oldDoc = [p('helloworld')] as ASTDocument;
    engine.document.set(oldDoc);
    const bystander = lp(0, 8);
    const flatBefore = logicalToPos(oldDoc, bystander);

    engine.selection.live.set({ start: lp(0, 5), end: lp(0, 5), isCollapsed: true } as any);
    engine.handleEnter();
    const newDoc = engine.document();
    expect(newDoc).toHaveLength(2);

    const map = diffFlat(oldDoc, newDoc)!;
    const mapped = posToLogical(newDoc, map.map(flatBefore))!;
    expect(mapped.blockIndex).toBe(1);
    expect(mapped.offset).toBe(3);
    expect(charAt(newDoc, mapped)).toBe('l');
  });
});

describe('depth-agnostic mapping (where typed ops go coarse)', () => {
  it('an edit in list item 1 maps a cursor in item 3 exactly — through the whole-list splice fallback', () => {
    const oldDoc = [p('x'), ul(li('aaa'), li('bbb'), li('ccc'))] as ASTDocument;
    const newDoc = [p('x'), ul(li('aXaa'), li('bbb'), li('ccc'))] as ASTDocument;

    const map = diffFlat(oldDoc, newDoc)!;
    expect(map.ranges.map(([, o, n]) => [o, n])).toEqual([[0, 1]]);

    const bystander = lp(1, 2, { itemIndex: 2 });
    const mapped = posToLogical(newDoc, map.map(logicalToPos(oldDoc, bystander)))!;
    expect(mapped.itemIndex).toBe(2);
    expect(mapped.offset).toBe(2);
    expect(charAt(newDoc, mapped)).toBe('c');
  });

  it('a peer insert earlier in the doc shifts a local cursor without touching its block', () => {
    const oldDoc = [p('first'), hr(), p('second')] as ASTDocument;
    const newDoc = [p('first!'), hr(), p('second')] as ASTDocument;
    const map = diffFlat(oldDoc, newDoc)!;
    const local = lp(2, 4);
    const mapped = posToLogical(newDoc, map.map(logicalToPos(oldDoc, local)))!;
    expect(mapped.blockIndex).toBe(2);
    expect(mapped.offset).toBe(4);
    expect(charAt(newDoc, mapped)).toBe('n');
  });

  it('a cursor inside remotely-deleted text reports deleted and snaps to the cut', () => {
    const oldDoc = [p('keep DOOMED keep')] as ASTDocument;
    const newDoc = [p('keep  keep')] as ASTDocument;
    const map = diffFlat(oldDoc, newDoc)!;
    const inside = logicalToPos(oldDoc, lp(0, 8));
    const res = map.mapResult(inside, -1);
    expect(res.deleted).toBe(true);
    const snapped = posToLogical(newDoc, res.pos)!;
    expect(snapped.offset).toBe(5);
  });
});