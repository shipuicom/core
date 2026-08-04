import { describe, expect, it } from 'vitest';
import { createDocument, getText } from './document';
import { applyFlatChanges, applyFlatChangesBatched } from './flat-edit';
import { FlatChange, indexFor } from './line-index';

const doc = (text: string) => createDocument(text);

/** Descending by `from`, the order `fanOutEdit` emits and this primitive expects. */
const descending = (changes: FlatChange[]) => [...changes].sort((a, b) => b.from - a.from);

describe('applyFlatChangesBatched', () => {
  it('inserts at several cursors in one pass', () => {
    const d = doc('one\ntwo\nthree');
    const index = indexFor(d);
    const changes = descending(
      [0, 1, 2].map((line) => ({ from: index.startOf(line), to: index.startOf(line), insert: '> ' }))
    );
    expect(getText(applyFlatChangesBatched(d, changes).doc)).toBe('> one\n> two\n> three');
  });

  it('deletes at several cursors in one pass', () => {
    const d = doc('aXbXc');
    const changes = descending([
      { from: 1, to: 2, insert: '' },
      { from: 3, to: 4, insert: '' },
    ]);
    expect(getText(applyFlatChangesBatched(d, changes).doc)).toBe('abc');
  });

  it('replaces across line boundaries', () => {
    const d = doc('one\ntwo\nthree\nfour');
    const index = indexFor(d);
    const changes = descending([
      { from: 0, to: index.endOf(1), insert: 'X' },
      { from: index.startOf(3), to: index.endOf(3), insert: 'Y' },
    ]);
    expect(getText(applyFlatChangesBatched(d, changes).doc)).toBe('X\nthree\nY');
  });

  it('handles an inserted newline, splitting one line into two', () => {
    const d = doc('ab\ncd');
    const changes = descending([
      { from: 1, to: 1, insert: '\n' },
      { from: 4, to: 4, insert: '\n' },
    ]);
    expect(getText(applyFlatChangesBatched(d, changes).doc)).toBe('a\nb\nc\nd');
  });

  it('handles a multi-line insert at several cursors', () => {
    const d = doc('a\nb');
    const changes = descending([
      { from: 0, to: 0, insert: 'X\nY' },
      { from: 2, to: 2, insert: 'P\nQ' },
    ]);
    expect(getText(applyFlatChangesBatched(d, changes).doc)).toBe('X\nYa\nP\nQb');
  });

  it('deletes a whole line, joining its neighbours', () => {
    const d = doc('one\ntwo\nthree');
    const index = indexFor(d);
    const changes = descending([{ from: index.endOf(0), to: index.endOf(1), insert: '' }]);
    expect(getText(applyFlatChangesBatched(d, changes).doc)).toBe('one\nthree');
  });

  it('leaves an empty change list alone, document identity included', () => {
    const d = doc('unchanged');
    const result = applyFlatChangesBatched(d, []);
    expect(result.doc).toBe(d);
    expect(result.inverse).toEqual([]);
  });

  it('keeps untouched lines by identity, so downstream skip checks still work', () => {
    const d = doc('l0\nl1\nl2\nl3\nl4\nl5');
    const index = indexFor(d);
    const changes = descending([
      { from: index.startOf(1), to: index.startOf(1), insert: 'x' },
      { from: index.startOf(4), to: index.startOf(4), insert: 'x' },
    ]);
    const next = applyFlatChangesBatched(d, changes).doc;
    expect(next.lines[0]).toBe(d.lines[0]);
    expect(next.lines[2]).toBe(d.lines[2]);
    expect(next.lines[3]).toBe(d.lines[3]);
    expect(next.lines[1]).not.toBe(d.lines[1]);
  });
});

describe('applyFlatChangesBatched agrees with the one-at-a-time path', () => {
  const cases: { name: string; text: string; changes: FlatChange[] }[] = [
    {
      name: 'inserts at line starts',
      text: 'alpha\nbeta\ngamma\ndelta',
      changes: [
        { from: 0, to: 0, insert: '  ' },
        { from: 6, to: 6, insert: '  ' },
        { from: 11, to: 11, insert: '  ' },
      ],
    },
    {
      name: 'mixed inserts, deletes and replaces',
      text: 'one\ntwo\nthree\nfour\nfive',
      changes: [
        { from: 1, to: 2, insert: 'XX' },
        { from: 5, to: 5, insert: '\n' },
        { from: 9, to: 13, insert: '' },
        { from: 16, to: 17, insert: 'ZZZ' },
      ],
    },
    {
      name: 'edits touching the document edges',
      text: 'first\nmiddle\nlast',
      changes: [
        { from: 0, to: 1, insert: 'F' },
        { from: 16, to: 17, insert: 'T' },
      ],
    },
    {
      name: 'an edit spanning several lines',
      text: 'a\nb\nc\nd\ne\nf',
      changes: [
        { from: 0, to: 0, insert: 'start ' },
        { from: 4, to: 9, insert: 'MERGED' },
      ],
    },
  ];

  for (const { name, text, changes } of cases) {
    it(name, () => {
      const d = doc(text);
      const ordered = descending(changes);
      const batched = applyFlatChangesBatched(d, ordered);
      const stepwise = applyFlatChanges(d, ordered);
      expect(getText(batched.doc)).toBe(getText(stepwise.doc));
    });

    it(`${name} — inverse restores the original`, () => {
      const d = doc(text);
      const ordered = descending(changes);
      const { doc: next, inverse } = applyFlatChangesBatched(d, ordered);
      expect(getText(applyFlatChanges(next, inverse).doc)).toBe(text);
    });
  }
});

describe('applyFlatChangesBatched at scale', () => {
  it('applies one change per line across a large document', () => {
    const lineCount = 20_000;
    const d = doc(Array.from({ length: lineCount }, (_, i) => `line ${i}`).join('\n'));
    const index = indexFor(d);
    const changes = descending(
      Array.from({ length: lineCount }, (_, i) => ({
        from: index.startOf(i),
        to: index.startOf(i),
        insert: '# ',
      }))
    );
    const next = applyFlatChangesBatched(d, changes).doc;
    expect(next.lines).toHaveLength(lineCount);
    expect(next.lines[0].text).toBe('# line 0');
    expect(next.lines[lineCount - 1].text).toBe(`# line ${lineCount - 1}`);
  });

  it('round-trips a large batch through its inverse', () => {
    const lineCount = 5_000;
    const text = Array.from({ length: lineCount }, (_, i) => `line ${i}`).join('\n');
    const d = doc(text);
    const index = indexFor(d);
    const changes = descending(
      Array.from({ length: lineCount }, (_, i) => ({
        from: index.startOf(i),
        to: index.startOf(i) + 4,
        insert: 'ROW',
      }))
    );
    const { doc: next, inverse } = applyFlatChangesBatched(d, changes);
    expect(next.lines[7].text).toBe('ROW 7');
    // Undone through the batched path too — which is what the component does,
    // and the only path that stays linear at this size.
    expect(getText(applyFlatChangesBatched(next, inverse).doc)).toBe(text);
  });
});
