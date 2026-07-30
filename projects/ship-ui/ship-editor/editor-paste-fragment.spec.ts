import { describe, expect, it } from 'vitest';
import { fromColumnar, toColumnar } from './editor-columnar';
import { flatPosOfBlockChar, insertFragmentOp } from './editor-columnar-mutations';
import * as Behaviors from './standard-behaviors';
import { BaseBlockBehavior } from './editor-behaviors';
import { ASTBlockNode, ASTDocument } from './editor.types';

const blocks = new Map<string, BaseBlockBehavior>();
[
  new Behaviors.ParagraphBehavior(),
  new Behaviors.HeadingBehavior(),
  new Behaviors.HrBehavior(),
  new Behaviors.BulletListBehavior(),
  new Behaviors.OrderedListBehavior(),
  new Behaviors.ListItemBehavior(),
].forEach((b) => blocks.set(b.type, b));

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const li = (text: string): ASTBlockNode => ({ type: 'list-item', content: [{ type: 'text', text }] });
const ul = (...items: ASTBlockNode[]): ASTBlockNode => ({ type: 'bullet-list', content: items });

/** Doc ending in a list, caret at the end of the last item — the reported shape. */
const docEndingInList = (): ASTDocument => [p('top'), ul(li('one'), li('two'))];
const caretAtLastItemEnd = (cd: ReturnType<typeof toColumnar>) => {
  const pos = flatPosOfBlockChar(cd, { blockIndex: 1, itemIndex: 1, charOffset: 3 });
  return { from: pos, to: pos };
};

const shape = (cd: ReturnType<typeof toColumnar>) =>
  fromColumnar(cd).map((b) => ({
    type: b.type,
    text:
      typeof (b.content as any[])[0]?.text === 'string'
        ? (b.content as any[]).map((n) => n.text).join('')
        : (b.content as ASTBlockNode[]).map((item) => (item.content as any[]).map((n) => n.text).join('')),
  }));

describe('insertFragmentOp into a list item', () => {
  it('block content lands after the containing list, whole', () => {
    const cd = toColumnar(docEndingInList());
    const sel = caretAtLastItemEnd(cd);
    const mutation = insertFragmentOp(cd, sel, [p('alpha'), p('beta')], blocks)!;
    expect(shape(cd)).toEqual([
      { type: 'paragraph', text: 'top' },
      { type: 'bullet-list', text: ['one', 'two'] },
      { type: 'paragraph', text: 'alpha' },
      { type: 'paragraph', text: 'beta' },
    ]);
    // Caret at the end of the last pasted block.
    expect(mutation.selAfter.from).toBe(flatPosOfBlockChar(cd, { blockIndex: 3, charOffset: 4 }));
  });

  it('a whole copied document (the select-all shape) also lands after the list', () => {
    const cd = toColumnar(docEndingInList());
    insertFragmentOp(cd, caretAtLastItemEnd(cd), [p('top'), ul(li('one'), li('two'))], blocks);
    expect(shape(cd)).toEqual([
      { type: 'paragraph', text: 'top' },
      { type: 'bullet-list', text: ['one', 'two'] },
      { type: 'paragraph', text: 'top' },
      { type: 'bullet-list', text: ['one', 'two'] },
    ]);
  });

  it('structural blocks (voids, headings) land after the list too', () => {
    const cd = toColumnar(docEndingInList());
    insertFragmentOp(cd, caretAtLastItemEnd(cd), [{ type: 'hr', content: [] }, { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'H' }] }], blocks);
    expect(shape(cd).map((b) => b.type)).toEqual(['paragraph', 'bullet-list', 'hr', 'heading']);
  });

  it('a fragment of the same list kind still splices in as items', () => {
    const cd = toColumnar(docEndingInList());
    insertFragmentOp(cd, caretAtLastItemEnd(cd), [ul(li('x'), li('y'))], blocks);
    const out = shape(cd);
    expect(out).toHaveLength(2); // no new top-level block
    expect(out[1].text).toEqual(['one', 'twox', 'y']); // first pasted item merges at the caret
  });

  it('a different list kind is block content and goes after', () => {
    const cd = toColumnar(docEndingInList());
    insertFragmentOp(cd, caretAtLastItemEnd(cd), [{ type: 'ordered-list', content: [li('x'), li('y')] }], blocks);
    expect(shape(cd).map((b) => b.type)).toEqual(['paragraph', 'bullet-list', 'ordered-list']);
    expect(shape(cd)[1].text).toEqual(['one', 'two']); // untouched
  });

  it('inline content still merges into the item', () => {
    const cd = toColumnar(docEndingInList());
    const sel = caretAtLastItemEnd(cd);
    insertFragmentOp(cd, sel, [p('XX')], blocks);
    expect(shape(cd)).toEqual([
      { type: 'paragraph', text: 'top' },
      { type: 'bullet-list', text: ['one', 'twoXX'] },
    ]);
  });

  it('block content pasted from a mid-list caret leaves later items in place', () => {
    const cd = toColumnar([p('top'), ul(li('one'), li('two'), li('three'))]);
    const pos = flatPosOfBlockChar(cd, { blockIndex: 1, itemIndex: 0, charOffset: 3 });
    insertFragmentOp(cd, { from: pos, to: pos }, [p('mid')], blocks); // inline → merges
    expect(shape(cd)[1].text).toEqual(['onemid', 'two', 'three']);
    insertFragmentOp(cd, { from: pos, to: pos }, [p('a'), { type: 'hr', content: [] }], blocks);
    expect(shape(cd).map((b) => b.type)).toEqual(['paragraph', 'bullet-list', 'paragraph', 'hr']);
    expect(shape(cd)[1].text).toEqual(['onemid', 'two', 'three']); // items untouched — 'a' went after the list
  });
});
