import { describe, expect, it } from 'vitest';
import { buildTree, charsBefore, checkTree, lineAt, lineAtOffset, sliceLines, spliceTree, treeHeight, treeText, type LineNode } from './line-tree';

/** mulberry32: deterministic randomness so a failure reproduces. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lines = (n: number, tag = 'l') => Array.from({ length: n }, (_, i) => `${tag}${i}${'x'.repeat(i % 7)}`);

/** Every read agrees with the plain array, and the invariants hold. */
function expectSame(tree: LineNode, model: string[]) {
  checkTree(tree);
  expect(tree.lineCount).toBe(model.length);
  expect(treeText(tree)).toBe(model.join('\n'));
  let offset = 0;
  for (let i = 0; i < model.length; i++) {
    expect(lineAt(tree, i)).toBe(model[i]);
    expect(charsBefore(tree, i) + i).toBe(offset);
    expect(lineAtOffset(tree, offset)).toEqual({ line: i, start: offset });
    // The last slot of a line (its newline) still belongs to it.
    expect(lineAtOffset(tree, offset + model[i]!.length).line).toBe(i);
    offset += model[i]!.length + 1;
  }
}

describe('line tree', () => {
  it('builds balanced trees of any size', () => {
    for (const n of [0, 1, 31, 32, 33, 64, 65, 1000, 50_000]) {
      const model = n ? lines(n) : [''];
      const tree = buildTree(model);
      checkTree(tree);
      expect(tree.lineCount).toBe(model.length);
      expect(treeText(tree)).toBe(model.join('\n'));
    }
    expect(treeHeight(buildTree(lines(50_000)))).toBeLessThanOrEqual(3);
  });

  it('slices line ranges', () => {
    const model = lines(5000);
    const tree = buildTree(model);
    expect(sliceLines(tree, 0, 5000)).toEqual(model);
    expect(sliceLines(tree, 1234, 1300)).toEqual(model.slice(1234, 1300));
    expect(sliceLines(tree, 4999, 5000)).toEqual(['l4999' + 'x'.repeat(4999 % 7)]);
    expect(sliceLines(tree, 10, 10)).toEqual([]);
  });

  it('agrees with an array under random splices', () => {
    const rand = prng(42);
    for (let round = 0; round < 25; round++) {
      let model = lines(Math.floor(rand() * 3000) + 1, `r${round}-`);
      let tree = buildTree(model);
      for (let step = 0; step < 60; step++) {
        const start = Math.floor(rand() * (model.length + 1));
        const kind = rand();
        // Mostly small edits like typing, sometimes large inserts and deletes that span many leaves.
        const deleteCount = kind < 0.5 ? Math.floor(rand() * 2) : kind < 0.8 ? Math.floor(rand() * 80) : Math.floor(rand() * 2000);
        const insertCount = kind < 0.5 ? Math.floor(rand() * 2) : kind < 0.8 ? Math.floor(rand() * 80) : Math.floor(rand() * 2000);
        const insert = lines(insertCount, `s${step}-`);
        const before = tree;
        const beforeText = step % 10 === 9 ? treeText(before) : '';
        tree = spliceTree(tree, start, deleteCount, insert);
        model = model.slice(0, start).concat(insert, model.slice(start + deleteCount));
        if (model.length === 0) model = [''];
        checkTree(tree);
        // Full text comparisons are O(n); every 10th step and the last are enough to catch a wrong splice.
        if (step % 10 === 9) {
          // Persistent: the old version is untouched.
          expect(treeText(before)).toBe(beforeText);
          expect(treeText(tree)).toBe(model.join('\n'));
        }
      }
      expectSame(tree, model);
    }
  }, 30_000);

  it('shares untouched subtrees and copies only one path for a one-line edit', () => {
    const tree = buildTree(lines(50_000));
    const next = spliceTree(tree, 25_000, 1, ['changed']);
    expect(lineAt(next, 25_000)).toBe('changed');
    expect(next.leaf).toBe(false);
    if (tree.leaf || next.leaf) return;
    const shared = next.children.filter((c) => tree.children.includes(c)).length;
    expect(shared).toBe(tree.children.length - 1);
  });

  it('keeps the height logarithmic through heavy editing', () => {
    let tree = buildTree(lines(1000));
    for (let i = 0; i < 2000; i++) tree = spliceTree(tree, (i * 7919) % tree.lineCount, 0, lines(20, `g${i}-`));
    checkTree(tree);
    expect(tree.lineCount).toBe(41_000);
    expect(treeHeight(tree)).toBeLessThanOrEqual(4);
    for (let i = 0; i < 40_000; i += 37) tree = spliceTree(tree, Math.min(i, tree.lineCount - 1), 30, []);
    checkTree(tree);
  });

  it('never leaves a document without a line', () => {
    const tree = spliceTree(buildTree(lines(500)), 0, 500, []);
    expect(tree.lineCount).toBe(1);
    expect(lineAt(tree, 0)).toBe('');
  });
});
