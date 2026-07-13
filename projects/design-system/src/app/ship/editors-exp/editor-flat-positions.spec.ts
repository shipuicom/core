// @vitest-environment jsdom
import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { StepMap, diffFlat, docSize, logicalToPos, nodeSize, posToLogical, stepMapFromOp } from './editor-flat-positions';
import { ASTDocument, LogicalPosition } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { ParagraphBehavior } from './standard-behaviors';

/**
 * SPIKE acceptance tests for flat (ProseMirror-style) position addressing.
 *
 * The headline case: a backspace block-merge, where a cursor sitting in the
 * second block must land on the SAME character of the merged block. The typed
 * BlockSplice cannot express that correspondence; the flat token diff maps it
 * exactly. If these tests hold, flat positions are a viable substrate for
 * remote-cursor mapping / presence in the collab layer.
 */

const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const li = (text: string) => ({ type: 'list-item', content: [{ type: 'text', text }] });
const ul = (...items: any[]) => ({ type: 'bullet-list', content: items });
const hr = () => ({ type: 'hr', content: [] });
const lp = (blockIndex: number, offset: number, extra: Partial<LogicalPosition> = {}): LogicalPosition =>
  ({ blockIndex, inlineIndex: 0, offset, ...extra }) as LogicalPosition;

/** The character right after a logical caret — identity check across mappings. */
function charAt(doc: ASTDocument, pos: LogicalPosition): string {
  const block = doc[pos.blockIndex];
  const content = (pos.itemIndex !== undefined ? (block.content as any[])[pos.itemIndex].content : block.content) as any[];
  let off = pos.offset;
  for (let i = 0; i < pos.inlineIndex; i++) off += content[i].text.length;
  return content.map((n) => n.text).join('')[off] ?? '<end>';
}

describe('flat position space', () => {
  it('nodeSize/docSize: text, container, void', () => {
    expect(nodeSize(p('ab') as any)).toBe(4); // <p> a b </p>
    expect(nodeSize(hr() as any)).toBe(1);
    expect(nodeSize(ul(li('cd')) as any)).toBe(6); // <ul> <li> c d </li> </ul>
    expect(docSize([p('ab'), hr(), ul(li('cd'))] as ASTDocument)).toBe(11);
  });

  it('logicalToPos matches the token diagram', () => {
    const doc = [p('ab'), ul(li('cd'))] as ASTDocument;
    // 0 <p> 1 a 2 b 3 </p> 4 <ul> 5 <li> 6 c 7 d 8 </li> 9 </ul> 10
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
      lp(0, 1, { inlineIndex: 1 }), // inside the bold run
      lp(2, 0, { itemIndex: 0 }),
      lp(2, 3, { itemIndex: 1 }),
    ];
    for (const c of carets) {
      const back = posToLogical(doc, logicalToPos(doc, c))!;
      // Compare by flat position (inline runs may resolve at run boundaries differently)
      expect(logicalToPos(doc, back), JSON.stringify(c)).toBe(logicalToPos(doc, c));
      expect(charAt(doc, back)).toBe(charAt(doc, c));
    }
  });

  it('StepMap: before/inside/after, assoc tie-break, invert, deleted flag', () => {
    const map = new StepMap([[5, 2, 6]]); // replace 2 tokens at 5 with 6
    expect(map.map(3)).toBe(3); // before
    expect(map.map(9)).toBe(13); // after: +4
    expect(map.map(6)).toBe(11); // inside, assoc 1 -> new end
    expect(map.map(6, -1)).toBe(5); // inside, assoc -1 -> start
    expect(map.mapResult(6).deleted).toBe(true);
    expect(map.mapResult(5).deleted).toBe(false); // boundary is not deleted
    const insert = new StepMap([[4, 0, 3]]);
    expect(insert.map(4, -1)).toBe(4); // stay before the insertion
    expect(insert.map(4, 1)).toBe(7); // move after it
    expect(insert.invert().map(7)).toBe(4); // and back
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

    // A second cursor (another user / a saved selection) parked at "wor|ld".
    const bystander = lp(1, 3);
    expect(charAt(oldDoc, bystander)).toBe('l');
    const flatBefore = logicalToPos(oldDoc, bystander);

    // Local user backspaces at the start of block 1 -> blocks merge.
    engine.selection.live.set({ start: lp(1, 0), end: lp(1, 0), isCollapsed: true } as any);
    engine.handleBackspace();
    const newDoc = engine.document();
    expect(newDoc).toHaveLength(1);
    expect((newDoc[0].content as any[]).map((n) => n.text).join('')).toBe('helloworld');

    // Flat diff sees the merge as exactly the 2 boundary tokens (</p><p>) going away.
    const map = diffFlat(oldDoc, newDoc)!;
    expect(map.ranges).toEqual([[6, 2, 0]]);

    // The bystander cursor maps EXACTLY: same character, offset len('hello')+3.
    const mapped = posToLogical(newDoc, map.map(flatBefore))!;
    expect(mapped.blockIndex).toBe(0);
    expect(mapped.offset).toBe(8); // 'hellowor|ld'
    expect(charAt(newDoc, mapped)).toBe('l');

    // ...and maps back through the inverse (undo direction).
    const restored = posToLogical(oldDoc, map.invert().map(logicalToPos(newDoc, mapped)))!;
    expect(logicalToPos(oldDoc, restored)).toBe(flatBefore);
  });

  it('CONTRAST: the typed BlockSplice for the same merge cannot recover the cursor', () => {
    const oldDoc = [p('hello'), p('world')] as ASTDocument;
    engine.document.set(oldDoc);
    engine.selection.live.set({ start: lp(1, 0), end: lp(1, 0), isCollapsed: true } as any);
    engine.handleBackspace();

    const tx = engine.lastTransaction()!;
    expect(tx.op.kind).toBe('block'); // removed:[hello,world] inserted:[helloworld]
    const spliceMap = stepMapFromOp(oldDoc, tx.op as any);

    const flatBefore = logicalToPos(oldDoc, lp(1, 3)); // "wor|ld"
    const exact = logicalToPos(engine.document(), lp(0, 8)); // where it SHOULD land
    // The splice covers both whole blocks as one opaque range: interior
    // positions can only snap to a range edge — information is already gone.
    const coarse = spliceMap.map(flatBefore, -1);
    expect(spliceMap.mapResult(flatBefore).deleted).toBe(true);
    expect(coarse).not.toBe(exact);
  });

  it('Enter (split) maps a trailing cursor into the new block', () => {
    const oldDoc = [p('helloworld')] as ASTDocument;
    engine.document.set(oldDoc);
    const bystander = lp(0, 8); // 'hellowor|ld'
    const flatBefore = logicalToPos(oldDoc, bystander);

    engine.selection.live.set({ start: lp(0, 5), end: lp(0, 5), isCollapsed: true } as any);
    engine.handleEnter();
    const newDoc = engine.document();
    expect(newDoc).toHaveLength(2);

    const map = diffFlat(oldDoc, newDoc)!;
    const mapped = posToLogical(newDoc, map.map(flatBefore))!;
    expect(mapped.blockIndex).toBe(1);
    expect(mapped.offset).toBe(3); // 'wor|ld' in the new block
    expect(charAt(newDoc, mapped)).toBe('l');
  });
});

describe('depth-agnostic mapping (where typed ops go coarse)', () => {
  it('an edit in list item 1 maps a cursor in item 3 exactly — through the whole-list splice fallback', () => {
    const oldDoc = [p('x'), ul(li('aaa'), li('bbb'), li('ccc'))] as ASTDocument;
    const newDoc = [p('x'), ul(li('aXaa'), li('bbb'), li('ccc'))] as ASTDocument;

    // Flat diff refuses to be coarse: exactly one inserted character token.
    const map = diffFlat(oldDoc, newDoc)!;
    expect(map.ranges.map(([, o, n]) => [o, n])).toEqual([[0, 1]]);

    const bystander = lp(1, 2, { itemIndex: 2 }); // 'cc|c'
    const mapped = posToLogical(newDoc, map.map(logicalToPos(oldDoc, bystander)))!;
    expect(mapped.itemIndex).toBe(2);
    expect(mapped.offset).toBe(2);
    expect(charAt(newDoc, mapped)).toBe('c');
  });

  it('a peer insert earlier in the doc shifts a local cursor without touching its block', () => {
    const oldDoc = [p('first'), hr(), p('second')] as ASTDocument;
    const newDoc = [p('first!'), hr(), p('second')] as ASTDocument;
    const map = diffFlat(oldDoc, newDoc)!;
    const local = lp(2, 4); // 'seco|nd'
    const mapped = posToLogical(newDoc, map.map(logicalToPos(oldDoc, local)))!;
    expect(mapped.blockIndex).toBe(2);
    expect(mapped.offset).toBe(4);
    expect(charAt(newDoc, mapped)).toBe('n');
  });

  it('a cursor inside remotely-deleted text reports deleted and snaps to the cut', () => {
    const oldDoc = [p('keep DOOMED keep')] as ASTDocument;
    const newDoc = [p('keep  keep')] as ASTDocument;
    const map = diffFlat(oldDoc, newDoc)!;
    const inside = logicalToPos(oldDoc, lp(0, 8)); // inside 'DOOMED'
    const res = map.mapResult(inside, -1);
    expect(res.deleted).toBe(true);
    const snapped = posToLogical(newDoc, res.pos)!;
    expect(snapped.offset).toBe(5); // at the excision point
  });
});
