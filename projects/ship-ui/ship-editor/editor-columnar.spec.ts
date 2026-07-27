import { describe, expect, it } from 'vitest';
import { ColumnarDocument, RowKind, fromColumnar, toColumnar } from './editor-columnar';
import { docSize, logicalToPos, posToLogical } from './editor-flat-positions';
import { ASTBlockNode, ASTDocument, ASTInlineNode } from './editor.types';

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });

/** Flattens a document to the things a round-trip must preserve. */
function semantics(doc: ASTDocument) {
  const rows: { type: string; depth: number; text: string; marksPerChar: string[]; attrs: string }[] = [];
  const walk = (block: ASTBlockNode, depth: number) => {
    const content = (block.content ?? []) as any[];
    const isContainer = content.length > 0 && typeof content[0]?.text !== 'string';
    const entry = { type: block.type, depth, text: '', marksPerChar: [] as string[], attrs: JSON.stringify(block.attrs ?? null) };
    if (!isContainer) {
      for (const node of content as ASTInlineNode[]) {
        entry.text += node.text ?? '';
        const key = (node.marks ?? [])
          .map((m) => (m.attrs ? `${m.type} ${JSON.stringify(m.attrs)}` : m.type))
          .sort()
          .join('|');
        for (let i = 0; i < (node.text ?? '').length; i++) entry.marksPerChar.push(key);
      }
    }
    rows.push(entry);
    if (isContainer) for (const child of content as ASTBlockNode[]) walk(child, depth + 1);
  };
  doc.forEach((b) => walk(b, 0));
  return rows;
}

const roundTrip = (doc: ASTDocument) => fromColumnar(toColumnar(doc));

describe('columnar round-trip', () => {
  it('preserves a plain paragraph', () => {
    const doc = [p('hello world')];
    expect(roundTrip(doc)).toEqual(doc);
  });

  it('preserves block attributes', () => {
    const doc: ASTDocument = [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] }];
    expect(roundTrip(doc)).toEqual(doc);
  });

  it('preserves marks and their attributes', () => {
    const doc: ASTDocument = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'a ' },
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://x.test' } }] },
          { type: 'text', text: '.' },
        ],
      },
    ];
    expect(roundTrip(doc)).toEqual(doc);
  });

  it('preserves overlapping marks by splitting at every boundary', () => {
    const doc: ASTDocument = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'a', marks: [{ type: 'bold' }] },
          { type: 'text', text: 'bc', marks: [{ type: 'bold' }, { type: 'italic' }] },
          { type: 'text', text: 'd', marks: [{ type: 'italic' }] },
        ],
      },
    ];
    expect(semantics(roundTrip(doc))).toEqual(semantics(doc));
  });

  it('preserves nested containers, including which container type', () => {
    const doc: ASTDocument = [
      { type: 'bullet-list', content: [
        { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
        { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
      ] },
      { type: 'ordered-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'three' }] }] },
    ];
    expect(roundTrip(doc)).toEqual(doc);
  });

  it('keeps a void block distinct from a block holding empty text', () => {
    const doc: ASTDocument = [
      { type: 'hr', content: [] },
      { type: 'paragraph', content: [{ type: 'text', text: '' }] },
    ];
    const back = roundTrip(doc);
    expect(back).toEqual(doc);
    expect(docSize(back)).toBe(docSize(doc));
  });

  it('normalises redundant adjacent runs rather than preserving them verbatim', () => {
    const doc: ASTDocument = [
      { type: 'paragraph', content: [
        { type: 'text', text: 'foo' },
        { type: 'text', text: 'bar' },
      ] },
    ];
    const back = roundTrip(doc);
    expect(back).toEqual([p('foobar')]);
    expect(docSize(back)).toBe(docSize(doc));
  });

  it('is idempotent: a second round-trip changes nothing', () => {
    const doc: ASTDocument = [
      { type: 'paragraph', content: [
        { type: 'text', text: 'x' },
        { type: 'text', text: 'y', marks: [{ type: 'bold' }] },
      ] },
    ];
    const once = roundTrip(doc);
    expect(roundTrip(once)).toEqual(once);
  });
});

describe('columnar position maths agrees with the tree implementation', () => {
  const sample: ASTDocument = [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
    p('first paragraph'),
    { type: 'hr', content: [] },
    { type: 'bullet-list', content: [
      { type: 'list-item', content: [{ type: 'text', text: 'alpha' }] },
      { type: 'list-item', content: [{ type: 'text', text: 'beta' }] },
    ] },
    p('last'),
  ];

  it('reports the same total document size', () => {
    expect(toColumnar(sample).size).toBe(docSize(sample));
  });

  it('maps top-level block starts to the same position', () => {
    const cd = toColumnar(sample);
    for (const blockIndex of [0, 1, 2]) {
      expect(cd.rowToPos(blockIndex, 0)).toBe(logicalToPos(sample, { blockIndex, inlineIndex: 0, offset: 0 }));
    }
  });

  it('resolves every position to a row that covers it', () => {
    const cd = toColumnar(sample);
    for (let pos = 0; pos < cd.size; pos++) {
      const row = cd.posToRow(pos);
      expect(cd.startOf(row)).toBeLessThanOrEqual(pos);
      expect(row).toBeLessThan(cd.rows);
    }
  });

  it('reports the marks covering a given offset', () => {
    const cd = toColumnar([
      { type: 'paragraph', content: [
        { type: 'text', text: 'ab' },
        { type: 'text', text: 'cd', marks: [{ type: 'bold' }] },
      ] },
    ]);
    expect(cd.marksAt(0, 0)).toEqual([]);
    expect(cd.marksAt(0, 2).map((m) => m.type)).toEqual(['bold']);
    expect(cd.marksAt(0, 3).map((m) => m.type)).toEqual(['bold']);
  });

  it('agrees with posToLogical on flat documents', () => {
    let seed = 1;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let run = 0; run < 60; run++) {
      const doc: ASTDocument = [];
      const count = 1 + Math.floor(rnd() * 6);
      for (let i = 0; i < count; i++) doc.push(p('abcdefgh'.slice(0, Math.floor(rnd() * 8))));
      const cd = toColumnar(doc);
      for (let pos = 0; pos < docSize(doc); pos++) {
        const expected = posToLogical(doc, pos);
        if (!expected) continue;
        expect(cd.posToRow(pos), `run ${run} pos ${pos}`).toBe(expected.blockIndex);
      }
    }
  });
});

describe('columnar mutation', () => {
  const build = () => toColumnar([p('one'), p('two'), p('three')]);

  it('insertText updates the text, the size index and the version', () => {
    const cd = build();
    const before = cd.size;
    const v = cd.version;

    cd.insertText(1, 3, 'XY');

    expect(cd.textOf(1)).toBe('twoXY');
    expect(cd.size).toBe(before + 2);
    expect(cd.version).toBe(v + 1);
    // Rows after the edit must have shifted by exactly the inserted length.
    expect(cd.startOf(2)).toBe(cd.startOf(1) + 2 + 'twoXY'.length);
  });

  it('deleteText contracts the row and the size index', () => {
    const cd = build();
    const before = cd.size;

    cd.deleteText(0, 1, 2);

    expect(cd.textOf(0)).toBe('o');
    expect(cd.size).toBe(before - 2);
    expect(cd.startOf(1)).toBe(2 + 1);
  });

  it('keeps the size index consistent with a full recomputation after many edits', () => {
    const cd = toColumnar([p('alpha'), p('beta'), p('gamma'), p('delta')]);
    cd.insertText(0, 0, 'AA');
    cd.deleteText(2, 1, 3);
    cd.insertText(3, 2, 'ZZZ');
    cd.deleteText(0, 0, 1);

    // Independently recompute what every row start should be.
    let expected = 0;
    for (let row = 0; row < cd.rows; row++) {
      expect(cd.startOf(row), `row ${row}`).toBe(expected);
      expected += 2 + cd.textOf(row).length;
    }
    expect(cd.size).toBe(expected);
  });

  it('insertRows shifts following rows, marks and attributes', () => {
    const cd = toColumnar([
      p('first'),
      { type: 'paragraph', attrs: { align: 'center' }, content: [{ type: 'text', text: 'marked', marks: [{ type: 'bold' }] }] },
    ]);

    cd.insertRows(1, [{ type: 'paragraph', text: 'inserted' }]);

    expect(cd.rows).toBe(3);
    expect(cd.textOf(1)).toBe('inserted');
    // The marked, attributed row moved from index 1 to index 2 with both intact.
    expect(cd.textOf(2)).toBe('marked');
    expect(cd.attrsOf(2)).toEqual({ align: 'center' });
    expect(cd.marksAt(2, 0).map((m) => m.type)).toEqual(['bold']);
    expect(cd.marksAt(1, 0)).toEqual([]);
  });

  it('removeRows drops the row and shifts marks and attributes back', () => {
    const cd = toColumnar([
      p('first'),
      p('second'),
      { type: 'paragraph', attrs: { align: 'right' }, content: [{ type: 'text', text: 'third', marks: [{ type: 'italic' }] }] },
    ]);

    cd.removeRows(1, 1);

    expect(cd.rows).toBe(2);
    expect(cd.textOf(1)).toBe('third');
    expect(cd.attrsOf(1)).toEqual({ align: 'right' });
    expect(cd.marksAt(1, 0).map((m) => m.type)).toEqual(['italic']);
    expect(cd.size).toBe(2 + 'first'.length + 2 + 'third'.length);
  });

  it('grows past its initial capacity without corrupting rows', () => {
    const cd = toColumnar([p('seed')]);
    for (let i = 0; i < 200; i++) cd.insertRows(cd.rows, [{ type: 'paragraph', text: `row ${i}` }]);

    expect(cd.rows).toBe(201);
    expect(cd.textOf(0)).toBe('seed');
    expect(cd.textOf(200)).toBe('row 199');
    let expected = 0;
    for (let row = 0; row < cd.rows; row++) {
      expect(cd.startOf(row), `row ${row}`).toBe(expected);
      expected += 2 + cd.textOf(row).length;
    }
  });

  it('round-trips back to a nested document after mutation', () => {
    const cd = toColumnar([p('one'), p('two')]);
    cd.insertText(0, 3, '!');
    cd.insertRows(1, [{ type: 'heading', text: 'Middle', attrs: { level: 2 } }]);
    cd.deleteText(2, 0, 1);

    expect(fromColumnar(cd)).toEqual([
      p('one!'),
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Middle' }] },
      p('wo'),
    ]);
  });
});

describe('columnar mark ranges under text edits', () => {
  const marked = (): ColumnarDocument =>
    toColumnar([
      { type: 'paragraph', content: [
        { type: 'text', text: 'plain ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' tail' },
      ] },
    ]);

  it('shifts a mark range when text is inserted before it', () => {
    const cd = marked();
    cd.insertText(0, 0, 'XX');
    // 'bold' moved from [6,10) to [8,12)
    expect(cd.marksAt(0, 7)).toEqual([]);
    expect(cd.marksAt(0, 8).map((m) => m.type)).toEqual(['bold']);
    expect(cd.marksAt(0, 11).map((m) => m.type)).toEqual(['bold']);
    expect(cd.marksAt(0, 12)).toEqual([]);
  });

  it('leaves a mark range alone when text is inserted after it', () => {
    const cd = marked();
    cd.insertText(0, 12, 'ZZ');
    expect(cd.marksAt(0, 6).map((m) => m.type)).toEqual(['bold']);
    expect(cd.marksAt(0, 9).map((m) => m.type)).toEqual(['bold']);
    expect(cd.marksAt(0, 10)).toEqual([]);
  });

  it('contracts a mark range when part of it is deleted', () => {
    const cd = marked();
    cd.deleteText(0, 6, 2); // remove 'bo' from inside the bold run
    expect(cd.textOf(0)).toBe('plain ld tail');
    expect(cd.marksAt(0, 6).map((m) => m.type)).toEqual(['bold']);
    expect(cd.marksAt(0, 7).map((m) => m.type)).toEqual(['bold']);
    expect(cd.marksAt(0, 8)).toEqual([]);
  });

  it('drops a mark entirely when its whole range is deleted', () => {
    const cd = marked();
    cd.deleteText(0, 6, 4);
    expect(cd.textOf(0)).toBe('plain  tail');
    for (let i = 0; i < cd.textOf(0).length; i++) expect(cd.marksAt(0, i), `offset ${i}`).toEqual([]);
  });

  it('survives a round-trip after the range has been edited', () => {
    const cd = marked();
    cd.insertText(0, 0, 'XX');
    const back = fromColumnar(cd);
    expect(back[0].content).toEqual([
      { type: 'text', text: 'XXplain ' },
      { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
      { type: 'text', text: ' tail' },
    ]);
  });
});

describe('size index strategies are interchangeable', () => {
  // The chunked index trades query speed for cheap row insertion. Whichever is
  // selected, the observable behaviour must be identical.
  const script = (cd: ReturnType<typeof toColumnar>) => {
    cd.insertText(1, 2, 'XYZ');
    cd.insertRows(2, [{ type: 'paragraph', text: 'inserted' }, { type: 'heading', text: 'H', attrs: { level: 2 } }]);
    cd.deleteText(0, 1, 2);
    cd.removeRows(3, 1);
    cd.insertText(cd.rows - 1, 0, '!!');
    return cd;
  };

  const source = (): ASTDocument => [p('alpha'), p('bravo'), p('charlie'), p('delta'), p('echo')];

  it('produces the same sizes, starts and document after the same edits', () => {
    const flat = script(toColumnar(source(), 'flat'));
    const chunked = script(toColumnar(source(), 'chunked'));

    expect(chunked.rows).toBe(flat.rows);
    expect(chunked.size).toBe(flat.size);
    for (let row = 0; row < flat.rows; row++) {
      expect(chunked.startOf(row), `start of row ${row}`).toBe(flat.startOf(row));
      expect(chunked.textOf(row), `text of row ${row}`).toBe(flat.textOf(row));
    }
    for (let pos = 0; pos < flat.size; pos++) {
      expect(chunked.posToRow(pos), `pos ${pos}`).toBe(flat.posToRow(pos));
    }
    expect(fromColumnar(chunked)).toEqual(fromColumnar(flat));
  });

  it('stays consistent across enough insertions to force chunk splits', () => {
    const chunked = toColumnar([p('seed')], 'chunked');
    const flat = toColumnar([p('seed')], 'flat');
    for (let i = 0; i < 150; i++) {
      const at = i % 3 === 0 ? 0 : chunked.rows;
      chunked.insertRows(at, [{ type: 'paragraph', text: `row ${i}` }]);
      flat.insertRows(at, [{ type: 'paragraph', text: `row ${i}` }]);
    }
    expect(chunked.rows).toBe(flat.rows);
    expect(chunked.size).toBe(flat.size);
    for (let row = 0; row < flat.rows; row++) {
      expect(chunked.startOf(row), `start of row ${row}`).toBe(flat.startOf(row));
    }
  });

  it('stays consistent when rows are removed after splits', () => {
    const chunked = toColumnar([p('seed')], 'chunked');
    const flat = toColumnar([p('seed')], 'flat');
    for (let i = 0; i < 120; i++) {
      chunked.insertRows(chunked.rows, [{ type: 'paragraph', text: `row ${i}` }]);
      flat.insertRows(flat.rows, [{ type: 'paragraph', text: `row ${i}` }]);
    }
    for (let i = 0; i < 40; i++) {
      chunked.removeRows(5, 1);
      flat.removeRows(5, 1);
    }
    expect(chunked.rows).toBe(flat.rows);
    expect(chunked.size).toBe(flat.size);
    for (let row = 0; row < flat.rows; row++) {
      expect(chunked.startOf(row), `start of row ${row}`).toBe(flat.startOf(row));
    }
  });
});

describe('columnar row kinds', () => {
  it('classifies void, text and container rows', () => {
    const cd = toColumnar([
      { type: 'hr', content: [] },
      p('text'),
      { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'item' }] }] },
    ]);
    expect(cd.kindOf(0)).toBe(RowKind.Void);
    expect(cd.kindOf(1)).toBe(RowKind.Text);
    expect(cd.kindOf(2)).toBe(RowKind.Container);
    expect(cd.kindOf(3)).toBe(RowKind.Text);
    expect(cd.depthOf(3)).toBe(1);
    expect(cd.parentOf(3)).toBe(2);
  });
});
