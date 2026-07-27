import { describe, expect, it } from 'vitest';
import { fromColumnar, toColumnar } from './editor-columnar';
import { applyOpToColumnar } from './editor-columnar-ops';
import { applyOp, EditorOp } from './editor-transactions';
import { docSize } from './editor-flat-positions';
import { ASTBlockNode, ASTDocument } from './editor.types';

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });

/**
 * The property that lets columnar own the document: advancing it by an op must
 * land in the same place as rebuilding it from the tree after the same op. If
 * these ever diverge, the model has silently drifted from the engine.
 */
function expectIncrementalMatchesRebuild(doc: ASTDocument, op: EditorOp, label: string) {
  const incremental = toColumnar(doc);
  applyOpToColumnar(incremental, op);

  const rebuilt = toColumnar(applyOp(doc, op));

  expect(incremental.rows, `${label}: row count`).toBe(rebuilt.rows);
  expect(incremental.size, `${label}: document size`).toBe(rebuilt.size);
  for (let row = 0; row < rebuilt.rows; row++) {
    expect(incremental.typeOf(row), `${label}: type of row ${row}`).toBe(rebuilt.typeOf(row));
    expect(incremental.textOf(row), `${label}: text of row ${row}`).toBe(rebuilt.textOf(row));
    expect(incremental.kindOf(row), `${label}: kind of row ${row}`).toBe(rebuilt.kindOf(row));
    expect(incremental.parentOf(row), `${label}: parent of row ${row}`).toBe(rebuilt.parentOf(row));
    expect(incremental.startOf(row), `${label}: start of row ${row}`).toBe(rebuilt.startOf(row));
    expect(incremental.attrsOf(row), `${label}: attrs of row ${row}`).toEqual(rebuilt.attrsOf(row));
    for (let off = 0; off < rebuilt.textOf(row).length; off++) {
      expect(
        incremental.marksAt(row, off).map((m) => m.type).sort(),
        `${label}: marks at row ${row} offset ${off}`
      ).toEqual(rebuilt.marksAt(row, off).map((m) => m.type).sort());
    }
  }
  // And the whole thing still round-trips to the document the engine would hold.
  expect(fromColumnar(incremental), `${label}: round-trip`).toEqual(fromColumnar(rebuilt));
}

describe('applying an EditorOp to a columnar document', () => {
  it('inserts text', () => {
    const doc = [p('one'), p('two'), p('three')];
    expectIncrementalMatchesRebuild(
      doc,
      { kind: 'inline', blockIndex: 1, at: 3, removed: [], inserted: [{ type: 'text', text: 'XY' }] },
      'insert text'
    );
  });

  it('deletes text', () => {
    const doc = [p('alpha'), p('bravo')];
    expectIncrementalMatchesRebuild(
      doc,
      { kind: 'inline', blockIndex: 0, at: 1, removed: [{ type: 'text', text: 'lph' }], inserted: [] },
      'delete text'
    );
  });

  it('replaces text', () => {
    const doc = [p('hello world')];
    expectIncrementalMatchesRebuild(
      doc,
      { kind: 'inline', blockIndex: 0, at: 6, removed: [{ type: 'text', text: 'world' }], inserted: [{ type: 'text', text: 'there' }] },
      'replace text'
    );
  });

  it('inserts marked text', () => {
    const doc = [p('plain ')];
    expectIncrementalMatchesRebuild(
      doc,
      { kind: 'inline', blockIndex: 0, at: 6, removed: [], inserted: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] },
      'insert marked text'
    );
  });

  it('inserts text into a block that already carries marks', () => {
    const doc: ASTDocument = [
      { type: 'paragraph', content: [
        { type: 'text', text: 'a ' },
        { type: 'text', text: 'bee', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' c' },
      ] },
    ];
    expectIncrementalMatchesRebuild(
      doc,
      { kind: 'inline', blockIndex: 0, at: 0, removed: [], inserted: [{ type: 'text', text: 'ZZ' }] },
      'insert before an existing mark'
    );
  });

  it('inserts a block', () => {
    const doc = [p('one'), p('three')];
    expectIncrementalMatchesRebuild(doc, { kind: 'block', at: 1, removed: [], inserted: [p('two')] }, 'insert block');
  });

  it('removes a block', () => {
    const doc = [p('one'), p('two'), p('three')];
    expectIncrementalMatchesRebuild(doc, { kind: 'block', at: 1, removed: [p('two')], inserted: [] }, 'remove block');
  });

  it('replaces a block with several', () => {
    const doc = [p('one'), p('two')];
    expectIncrementalMatchesRebuild(
      doc,
      { kind: 'block', at: 1, removed: [p('two')], inserted: [p('a'), p('b'), p('c')] },
      'split a block'
    );
  });

  it('inserts a block carrying attributes', () => {
    const doc = [p('one')];
    expectIncrementalMatchesRebuild(
      doc,
      { kind: 'block', at: 1, removed: [], inserted: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'H' }] }] },
      'insert heading'
    );
  });

  it('inserts a void block', () => {
    const doc = [p('one'), p('two')];
    expectIncrementalMatchesRebuild(doc, { kind: 'block', at: 1, removed: [], inserted: [{ type: 'hr', content: [] }] }, 'insert hr');
  });

  it('inserts a container block with children', () => {
    const doc = [p('before'), p('after')];
    const list: ASTBlockNode = {
      type: 'bullet-list',
      content: [
        { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
        { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
      ],
    };
    expectIncrementalMatchesRebuild(doc, { kind: 'block', at: 1, removed: [], inserted: [list] }, 'insert list');
  });

  it('removes a container block along with its children', () => {
    const list: ASTBlockNode = {
      type: 'bullet-list',
      content: [
        { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
        { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
      ],
    };
    const doc = [p('before'), list, p('after')];
    expectIncrementalMatchesRebuild(doc, { kind: 'block', at: 1, removed: [list], inserted: [] }, 'remove list');
  });

  it('edits text in a block that sits after a container', () => {
    // Rows and block indices diverge here: the list occupies three rows, so the
    // paragraph after it is block 2 but row 4.
    const list: ASTBlockNode = {
      type: 'bullet-list',
      content: [
        { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
        { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
      ],
    };
    const doc = [p('before'), list, p('after')];
    expectIncrementalMatchesRebuild(
      doc,
      { kind: 'inline', blockIndex: 2, at: 5, removed: [], inserted: [{ type: 'text', text: '!' }] },
      'edit after a container'
    );
  });

  it('inserts a block after a container', () => {
    const list: ASTBlockNode = {
      type: 'bullet-list',
      content: [{ type: 'list-item', content: [{ type: 'text', text: 'x' }] }],
    };
    const doc = [list, p('tail')];
    expectIncrementalMatchesRebuild(doc, { kind: 'block', at: 1, removed: [], inserted: [p('mid')] }, 'insert after container');
  });

  it('stays consistent across a sequence of ops', () => {
    let doc: ASTDocument = [p('one'), p('two'), p('three')];
    const cd = toColumnar(doc);
    const ops: EditorOp[] = [
      { kind: 'inline', blockIndex: 0, at: 3, removed: [], inserted: [{ type: 'text', text: '!' }] },
      { kind: 'block', at: 1, removed: [], inserted: [p('inserted')] },
      { kind: 'inline', blockIndex: 3, at: 0, removed: [{ type: 'text', text: 'th' }], inserted: [] },
      { kind: 'block', at: 0, removed: [p('one!')], inserted: [] },
      { kind: 'inline', blockIndex: 0, at: 0, removed: [], inserted: [{ type: 'text', text: 'A' }] },
    ];
    for (const op of ops) {
      applyOpToColumnar(cd, op);
      doc = applyOp(doc, op);
      expect(cd.rows, 'rows after op').toBe(toColumnar(doc).rows);
      expect(cd.size, 'size after op').toBe(docSize(doc));
    }
    expect(fromColumnar(cd)).toEqual(doc);
  });
});
