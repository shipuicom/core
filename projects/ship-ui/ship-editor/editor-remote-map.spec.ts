import { describe, expect, it } from 'vitest';
import { toColumnar } from './editor-columnar';
import { remoteStepMap } from './editor-columnar-mutations';
import { StepMap, diffFlat } from './editor-flat-positions';
import { EditorOp, applyOp } from './editor-transactions';
import { ASTBlockNode, ASTDocument } from './editor.types';

/**
 * remoteStepMap must reproduce diffFlat's output exactly — including the tie
 * cases where inserted content equals its neighbours and diffFlat's trimming
 * slides past the op site. The oracle is the materialize-and-diff pipeline the
 * engine used before columnar owned the document.
 */

const p = (text: string, marks?: { type: string }[]): ASTBlockNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text, ...(marks ? { marks } : {}) }],
});
const h = (text: string, level: number): ASTBlockNode => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});
const hr = (): ASTBlockNode => ({ type: 'hr', content: [] });
const ul = (...texts: string[]): ASTBlockNode => ({
  type: 'bullet-list',
  content: texts.map((t) => ({ type: 'list-item', content: [{ type: 'text', text: t }] })),
});

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rnd: () => number, n: number) => Math.floor(rnd() * n);

function oracle(doc: ASTDocument, op: EditorOp): StepMap | null {
  return diffFlat(doc, applyOp(doc, op));
}

function expectSameMap(doc: ASTDocument, op: EditorOp, label: string) {
  const mine = remoteStepMap(toColumnar(doc), op);
  const want = oracle(doc, op);
  if (want === null) {
    expect(mine, label).toBeNull();
    return;
  }
  expect(mine, label).not.toBeNull();
  expect(mine!.ranges, label).toEqual(want.ranges);
}

describe('remoteStepMap matches the diffFlat oracle', () => {
  it('directed tie cases: inserted content equal to its neighbours', () => {
    const chain = [p('same'), p('same'), p('same'), p('same')];
    expectSameMap(chain, { kind: 'block', at: 1, removed: [], inserted: [p('same')] }, 'identical block into a chain');
    expectSameMap(chain, { kind: 'block', at: 0, removed: [p('same')], inserted: [] }, 'remove from a chain head');
    expectSameMap(chain, { kind: 'block', at: 3, removed: [p('same')], inserted: [p('same'), p('same')] }, 'grow the chain tail');

    const doc = [p('..')];
    expectSameMap(doc, { kind: 'inline', blockIndex: 0, at: 1, removed: [], inserted: [{ type: 'text', text: '.' }] }, 'insert a char equal to its neighbours');
    expectSameMap([p('ababab')], { kind: 'inline', blockIndex: 0, at: 2, removed: [], inserted: [{ type: 'text', text: 'ab' }] }, 'periodic text');
  });

  it('directed edges: boundaries, no-ops, and invalid targets', () => {
    const doc = [p('one'), ul('a', 'b'), hr(), h('title', 2), p('five')];
    expectSameMap(doc, { kind: 'block', at: 0, removed: [], inserted: [p('new')] }, 'insert at the very start');
    expectSameMap(doc, { kind: 'block', at: 5, removed: [], inserted: [p('new')] }, 'insert at the very end');
    expectSameMap(doc, { kind: 'block', at: 3, removed: [h('title', 2), p('five')], inserted: [] }, 'remove the tail');
    expectSameMap(doc, { kind: 'block', at: 1, removed: [ul('a', 'b')], inserted: [ul('a', 'b')] }, 'replace with an equal container');
    expectSameMap(doc, { kind: 'block', at: 2, removed: [hr()], inserted: [hr(), hr()] }, 'void beside void');
    expectSameMap(doc, { kind: 'inline', blockIndex: 1, at: 0, removed: [], inserted: [{ type: 'text', text: 'x' }] }, 'inline op on a container no-ops');
    expectSameMap(doc, { kind: 'inline', blockIndex: 2, at: 0, removed: [], inserted: [{ type: 'text', text: 'x' }] }, 'inline op on a void no-ops');
    expectSameMap(doc, { kind: 'inline', blockIndex: 0, at: 1, removed: [{ type: 'text', text: 'n' }], inserted: [{ type: 'text', text: 'n' }] }, 'identity inline replace');
    expectSameMap([p('a')], { kind: 'block', at: 0, removed: [p('a')], inserted: [] }, 'remove everything');
  });

  it('fuzz: 400 random documents and ops agree with the oracle', () => {
    const rnd = mulberry32(0xc01a51);
    const words = ['same', 'same', 'alpha', 'beta', 'gamma', ''];
    const randomBlock = (): ASTBlockNode => {
      const roll = rnd();
      if (roll < 0.45) {
        const marks = rnd() < 0.3 ? [{ type: 'bold' }] : undefined;
        return p(words[pick(rnd, words.length)], marks);
      }
      if (roll < 0.6) return h(words[pick(rnd, words.length)], 1 + pick(rnd, 3));
      if (roll < 0.75) return hr();
      return ul(...Array.from({ length: 1 + pick(rnd, 3) }, () => words[pick(rnd, words.length)]));
    };
    const randomDoc = (): ASTDocument => Array.from({ length: 1 + pick(rnd, 6) }, randomBlock);

    for (let iter = 0; iter < 400; iter++) {
      const doc = randomDoc();
      let op: EditorOp;
      if (rnd() < 0.5) {
        // Inline op, sometimes aimed at containers/voids or out of range.
        const blockIndex = pick(rnd, doc.length + 1);
        const text = words[pick(rnd, words.length)];
        op = {
          kind: 'inline',
          blockIndex,
          at: pick(rnd, 6),
          removed: rnd() < 0.4 ? [{ type: 'text', text: words[pick(rnd, words.length)] }] : [],
          inserted: rnd() < 0.8 ? [{ type: 'text', text, ...(rnd() < 0.2 ? { marks: [{ type: 'bold' }] } : {}) }] : [],
        };
      } else {
        const at = pick(rnd, doc.length + 2);
        op = {
          kind: 'block',
          at,
          removed: doc.slice(at, at + pick(rnd, 3)),
          inserted: Array.from({ length: pick(rnd, 3) }, randomBlock),
        };
      }
      expectSameMap(doc, op, `iter ${iter}: ${JSON.stringify(op)}`);
    }
  });
});
