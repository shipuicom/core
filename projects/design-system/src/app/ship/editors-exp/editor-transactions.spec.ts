// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  EditorOp,
  applyOp,
  diffDocuments,
  fragLen,
  invertOp,
  rebaseOp,
  sliceInline,
  spliceInlineContent,
  transformOp,
} from './editor-transactions';
import { ASTDocument, ASTInlineNode } from './editor.types';

/**
 * The operation algebra underneath the editor's history and (future) realtime
 * collab: char-level diffs with mark fidelity, inversion, and the OT transform
 * primitive including the TP1 convergence property for concurrent ops.
 */

const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const bold = (text: string): ASTInlineNode => ({ type: 'text', text, marks: [{ type: 'bold' }] });
const plain = (text: string): ASTInlineNode => ({ type: 'text', text });
const textOf = (doc: ASTDocument, i: number) => (doc[i].content as ASTInlineNode[]).map((n) => n.text).join('');
const deepEq = (a: unknown, b: unknown) => expect(JSON.stringify(a)).toBe(JSON.stringify(b));

describe('inline fragment helpers', () => {
  const content: ASTInlineNode[] = [plain('ab'), bold('cd'), plain('ef')];

  it('sliceInline splits nodes at char boundaries, marks intact', () => {
    const frag = sliceInline(content, 1, 5);
    deepEq(frag, [plain('b'), bold('cd'), plain('e')]);
  });

  it('spliceInlineContent replaces a range and renormalizes adjacent equal-mark runs', () => {
    // Replace "cd" (the bold run) with plain "XY" -> merges into one plain node.
    const out = spliceInlineContent(content, 2, 2, [plain('XY')]);
    deepEq(out, [plain('abXYef')]);
  });

  it('spliceInlineContent of everything leaves the empty-text placeholder', () => {
    const out = spliceInlineContent(content, 0, fragLen(content), []);
    deepEq(out, [plain('')]);
  });
});

describe('char-level diff', () => {
  it('captures only the changed characters', () => {
    const op = diffDocuments([p('hello world')], [p('hello brave world')])!;
    expect(op.kind).toBe('inline');
    if (op.kind !== 'inline') return;
    expect(op.at).toBe(6);
    expect(fragLen(op.removed)).toBe(0);
    expect(op.inserted.map((n) => n.text).join('')).toBe('brave ');
  });

  it('detects a pure mark change (same characters) as an inline op', () => {
    const oldDoc = [{ type: 'paragraph', content: [plain('make me bold')] }] as ASTDocument;
    const newDoc = [{ type: 'paragraph', content: [plain('make me '), bold('bold')] }] as ASTDocument;
    const op = diffDocuments(oldDoc, newDoc)!;
    expect(op.kind).toBe('inline');
    if (op.kind !== 'inline') return;
    expect(op.at).toBe(8);
    expect(op.removed.map((n) => n.text).join('')).toBe('bold');
    deepEq(op.inserted, [bold('bold')]);
  });

  it('treats node-structure-only differences as a no-op', () => {
    const a = [{ type: 'paragraph', content: [plain('ab')] }] as ASTDocument;
    const b = [{ type: 'paragraph', content: [plain('a'), plain('b')] }] as ASTDocument;
    expect(diffDocuments(a, b)).toBeNull();
  });

  it('falls back to a block op when attrs change', () => {
    const a = [{ type: 'paragraph', attrs: { align: '' }, content: [plain('x')] }] as ASTDocument;
    const b = [{ type: 'paragraph', attrs: { align: 'center' }, content: [plain('x')] }] as ASTDocument;
    expect(diffDocuments(a, b)!.kind).toBe('block');
  });

  it('inline op inversion round-trips through apply', () => {
    const oldDoc = [p('one'), p('twoX'), p('three')] as ASTDocument;
    const newDoc = [p('one'), p('two'), p('three')] as ASTDocument; // deletion
    const op = diffDocuments(oldDoc, newDoc)!;
    deepEq(applyOp(oldDoc, op), newDoc);
    deepEq(applyOp(newDoc, invertOp(op)), oldDoc);
  });
});

describe('transformOp', () => {
  const iop = (blockIndex: number, at: number, removed: string, inserted: string): EditorOp => ({
    kind: 'inline',
    blockIndex,
    at,
    removed: removed ? [plain(removed)] : [],
    inserted: inserted ? [plain(inserted)] : [],
  });

  it('shifts an inline op right of a concurrent earlier edit in the same block', () => {
    const op = iop(0, 10, '', 'X');
    const against = iop(0, 2, 'ab', 'wxyz'); // +2 chars before op
    const t = transformOp(op, against)!;
    expect(t.kind === 'inline' && t.at).toBe(12);
  });

  it('leaves an inline op before a concurrent later edit untouched', () => {
    const op = iop(0, 2, 'ab', '');
    const against = iop(0, 10, '', 'X');
    expect(transformOp(op, against)).toBe(op);
  });

  it('ops in different blocks are independent', () => {
    const op = iop(1, 3, '', 'X');
    expect(transformOp(op, iop(0, 0, 'aaaa', ''))).toBe(op);
  });

  it('same-point concurrent inserts: side decides order, both converge', () => {
    const doc = [p('ab')] as ASTDocument;
    const a = iop(0, 1, '', 'A');
    const b = iop(0, 1, '', 'B');
    const viaA = applyOp(applyOp(doc, a), transformOp(b, a, 'right')!);
    const viaB = applyOp(applyOp(doc, b), transformOp(a, b, 'left')!);
    deepEq(viaA, viaB);
    expect(textOf(viaA, 0)).toBe('aABb');
  });

  it('overlapping same-block edits conflict (null)', () => {
    expect(transformOp(iop(0, 2, 'cde', 'X'), iop(0, 3, 'd', 'Y'))).toBeNull();
  });

  it('an inline op survives a block splice before its block (index shifted)', () => {
    const op = iop(2, 1, '', 'X');
    const against: EditorOp = { kind: 'block', at: 0, removed: [p('a'), p('b')], inserted: [p('merged')] };
    const t = transformOp(op, against)!;
    expect(t.kind === 'inline' && t.blockIndex).toBe(1);
  });

  it('an inline op inside a replaced block conflicts (null)', () => {
    const op = iop(1, 0, '', 'X');
    const against: EditorOp = { kind: 'block', at: 1, removed: [p('gone')], inserted: [p('new')] };
    expect(transformOp(op, against)).toBeNull();
  });

  it('a block op absorbs a concurrent inline edit into its stored removed copy (inverse stays fresh)', () => {
    const doc = [p('keep'), p('doomed')] as ASTDocument;
    const blockOp: EditorOp = { kind: 'block', at: 1, removed: [p('doomed')], inserted: [] }; // delete block 1
    const inlineOp = iop(1, 6, '', '!!!'); // peer appends inside the doomed block
    const t = transformOp(blockOp, inlineOp)!;
    // Applying peer edit then the transformed delete, undo restores the PEER'S text.
    const afterPeer = applyOp(doc, inlineOp);
    const afterDelete = applyOp(afterPeer, t);
    expect(afterDelete).toHaveLength(1);
    const restored = applyOp(afterDelete, invertOp(t));
    expect(textOf(restored, 1)).toBe('doomed!!!');
  });

  it('TP1 convergence across a matrix of non-conflicting concurrent pairs', () => {
    const doc = [p('alpha'), p('bravo charlie'), p('delta')] as ASTDocument;
    const pairs: [EditorOp, EditorOp][] = [
      [iop(1, 0, '', 'X'), iop(1, 6, 'charlie', 'CHUCK')], // disjoint, same block
      [iop(0, 5, '', '!'), iop(2, 0, 'd', 'D')], // different blocks
      [iop(1, 6, '', 'X'), { kind: 'block', at: 0, removed: [p('alpha')], inserted: [] }], // inline vs block-before
      [
        { kind: 'block', at: 2, removed: [p('delta')], inserted: [p('d1'), p('d2')] },
        { kind: 'block', at: 0, removed: [p('alpha')], inserted: [] },
      ], // disjoint block ops
    ];
    for (const [a, b] of pairs) {
      const tb = transformOp(b, a, 'right');
      const ta = transformOp(a, b, 'left');
      expect(tb, JSON.stringify(b)).not.toBeNull();
      expect(ta, JSON.stringify(a)).not.toBeNull();
      const viaA = applyOp(applyOp(doc, a), tb!);
      const viaB = applyOp(applyOp(doc, b), ta!);
      deepEq(viaA, viaB);
    }
  });

  it('rebaseOp folds an op through a remote op list and reports conflicts', () => {
    const op = iop(1, 5, '', 'X');
    const remote: EditorOp[] = [
      iop(1, 0, '', 'aa'), // +2 -> at 7
      { kind: 'block', at: 0, removed: [p('z')], inserted: [p('z1'), p('z2')] }, // block 1 -> 2
    ];
    const t = rebaseOp(op, remote)!;
    expect(t.kind === 'inline' && t.at).toBe(7);
    expect(t.kind === 'inline' && t.blockIndex).toBe(2);
    // A destroying remote op yields null.
    expect(rebaseOp(op, [{ kind: 'block', at: 1, removed: [p('x')], inserted: [] }])).toBeNull();
  });
});
