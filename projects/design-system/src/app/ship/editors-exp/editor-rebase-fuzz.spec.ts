// @vitest-environment jsdom
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { diffFlat, logicalToPos, posToLogical } from './editor-flat-positions';
import { normalizeInlineNodes } from './editor-ast.utils';
import { EditorOp, applyOp, diffDocuments, invertOp, transformOp } from './editor-transactions';
import { ASTDocument, LogicalPosition } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { BulletListBehavior, ListItemBehavior, ParagraphBehavior } from './standard-behaviors';

/**
 * Deterministic fuzz suite for the rebase machinery.
 *
 * Three layers, in increasing realism:
 *
 * 1. **Op algebra (TP1)** — random concurrent op pairs from random documents:
 *    diff/apply must reproduce the mutation, inversion must round-trip, and
 *    whenever both transforms succeed the two application orders must
 *    converge: apply(apply(d,a), T(b,a,R)) === apply(apply(d,b), T(a,b,L)).
 *    Plus: flat-map cursor identity for every position outside the change.
 *
 * 2. **Engine marker oracle** — interleaved local typing and remote inserts,
 *    each edit a UNIQUE marker character. Insert-only traffic can never
 *    legitimately conflict, so after undoing ALL local history the document
 *    must contain every remote marker, zero local markers, and the untouched
 *    base text — an exact oracle for offset rebasing (a single mis-shifted
 *    undo deletes the wrong character and is caught immediately). Redo-all
 *    must then restore the pre-undo document byte-for-byte.
 *
 * 3. **Engine chaos** — all op kinds (typing, Enter, Backspace, range deletes,
 *    remote splits/merges/replacements). No exact oracle is possible once
 *    conflicts legitimately drop history entries, so the invariants are:
 *    never throws, the document stays structurally valid after every action
 *    and every undo, and undo-all → redo-all is a fixed point.
 *
 * All randomness is mulberry32 with fixed seeds — failures reproduce exactly.
 */

// ---------------------------------------------------------------------------
// Deterministic PRNG + helpers
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rnd = () => number;
const pick = (rnd: Rnd, n: number) => Math.floor(rnd() * n);

const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const li = (text: string) => ({ type: 'list-item', content: [{ type: 'text', text }] });
const ul = (...items: any[]) => ({ type: 'bullet-list', content: items });
const hr = () => ({ type: 'hr', content: [] });

const isText = (b: any) => Array.isArray(b.content) && b.content.length > 0 && typeof b.content[0]?.text === 'string';
const blockText = (b: any): string =>
  isText(b) ? b.content.map((n: any) => n.text).join('') : (b.content ?? []).map(blockText).join('');
const docText = (doc: ASTDocument) => doc.map(blockText).join('\n');
const deepEq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Canonicalize inline node structure (merge equal-mark runs, drop empties) so
 * comparisons are semantic: applyOp normalizes but engine transforms don't
 * always, and undo/redo must not be penalized for canonicalizing. */
const canonical = (doc: ASTDocument): ASTDocument =>
  (structuredClone(doc) as any[]).map((b) => {
    if (isText(b)) b.content = normalizeInlineNodes(b.content);
    else if (b.content?.length) {
      b.content = b.content.map((item: any) =>
        isText(item) ? { ...item, content: normalizeInlineNodes(item.content) } : item
      );
    }
    return b;
  }) as ASTDocument;
const semanticEq = (a: ASTDocument, b: ASTDocument) => deepEq(canonical(a), canonical(b));

/** Structural validity per the editor's AST invariants. */
function validate(doc: ASTDocument): string | null {
  if (!Array.isArray(doc) || doc.length === 0) return 'empty document';
  for (const block of doc) {
    if (!block?.type) return 'block without type';
    const c = block.content as any[];
    if (!Array.isArray(c)) return `non-array content in ${block.type}`;
    if (c.length === 0) continue; // void
    if (typeof c[0]?.text === 'string') {
      if (!c.every((n) => typeof n.text === 'string')) return `mixed inline content in ${block.type}`;
    } else {
      for (const item of c) {
        if (!item?.type || !Array.isArray(item.content)) return `bad container item in ${block.type}`;
      }
    }
  }
  return null;
}

function makeEngine(): EditorEngineService {
  const injector = Injector.create({
    providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
  });
  const engine = runInInjectionContext(injector, () => new EditorEngineService());
  [new ParagraphBehavior(), new BulletListBehavior(), new ListItemBehavior()].forEach((b) => engine.register(b));
  return engine;
}

const caretSel = (blockIndex: number, offset: number) =>
  ({ start: { blockIndex, inlineIndex: 0, offset }, end: { blockIndex, inlineIndex: 0, offset }, isCollapsed: true }) as any;

// ---------------------------------------------------------------------------
// Layer 1: op-algebra fuzz (TP1 convergence + diff/apply/invert + flat maps)
// ---------------------------------------------------------------------------

function randomBaseDoc(rnd: Rnd): ASTDocument {
  const blocks: any[] = [];
  const n = 2 + pick(rnd, 4);
  for (let i = 0; i < n; i++) {
    const roll = rnd();
    if (roll < 0.6) blocks.push(p('abcdefgh'.slice(0, 3 + pick(rnd, 5)) + i));
    else if (roll < 0.8) blocks.push(ul(li('one' + i), li('two' + i)));
    else blocks.push(hr());
  }
  return blocks as ASTDocument;
}

/** A random single mutation, returning the new doc (or null if impossible). */
function randomMutation(rnd: Rnd, doc: ASTDocument): ASTDocument | null {
  const kind = pick(rnd, 5);
  const textIdxs = doc.map((b, i) => (isText(b) ? i : -1)).filter((i) => i >= 0);
  const cloned = structuredClone(doc) as any[];
  switch (kind) {
    case 0: {
      // insert text inside a block
      if (!textIdxs.length) return null;
      const bi = textIdxs[pick(rnd, textIdxs.length)];
      const t = blockText(cloned[bi]);
      const at = pick(rnd, t.length + 1);
      cloned[bi] = p(t.slice(0, at) + 'INS' + t.slice(at));
      return cloned;
    }
    case 1: {
      // delete a char range inside a block
      if (!textIdxs.length) return null;
      const bi = textIdxs[pick(rnd, textIdxs.length)];
      const t = blockText(cloned[bi]);
      if (t.length < 2) return null;
      const from = pick(rnd, t.length - 1);
      const to = from + 1 + pick(rnd, t.length - from - 1);
      cloned[bi] = p(t.slice(0, from) + t.slice(to));
      return cloned;
    }
    case 2: {
      // replace a whole block
      const bi = pick(rnd, cloned.length);
      cloned[bi] = p('REPL' + pick(rnd, 100));
      return cloned;
    }
    case 3: {
      // split a text block
      if (!textIdxs.length) return null;
      const bi = textIdxs[pick(rnd, textIdxs.length)];
      const t = blockText(cloned[bi]);
      const at = pick(rnd, t.length + 1);
      cloned.splice(bi, 1, p(t.slice(0, at)), p(t.slice(at)));
      return cloned;
    }
    default: {
      // merge two adjacent text blocks
      const pairs = [];
      for (let i = 0; i + 1 < cloned.length; i++) if (isText(cloned[i]) && isText(cloned[i + 1])) pairs.push(i);
      if (!pairs.length) return null;
      const bi = pairs[pick(rnd, pairs.length)];
      const merged = p(blockText(cloned[bi]) + blockText(cloned[bi + 1]));
      cloned.splice(bi, 2, merged);
      return cloned;
    }
  }
}

describe('fuzz layer 1: op algebra (TP1, invert, flat maps)', () => {
  it('holds across 400 random concurrent pairs', () => {
    let convergenceChecks = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const rnd = mulberry32(seed);
      const base = randomBaseDoc(rnd);
      const mutA = randomMutation(rnd, base);
      const mutB = randomMutation(rnd, base);
      if (!mutA || !mutB) continue;
      const a = diffDocuments(base, mutA);
      const b = diffDocuments(base, mutB);
      if (!a || !b) continue;

      // diff + apply reproduces each mutation exactly
      expect(deepEq(applyOp(base, a), mutA), `seed ${seed}: applyOp(a)`).toBe(true);
      expect(deepEq(applyOp(base, b), mutB), `seed ${seed}: applyOp(b)`).toBe(true);
      // inversion round-trips
      expect(deepEq(applyOp(mutA as ASTDocument, invertOp(a)), base), `seed ${seed}: invert(a)`).toBe(true);

      // flat map preserves cursor identity outside the changed range. Only
      // offsets STRICTLY inside a block's text qualify — a cursor at
      // end-of-block sits on a boundary token, and "the char after it" is the
      // next block's first char, which may legitimately change.
      const map = diffFlat(base, mutA as ASTDocument);
      if (map) {
        const [start, oldSize] = map.ranges[0];
        for (let bi = 0; bi < base.length; bi++) {
          if (!isText(base[bi])) continue;
          const len = blockText(base[bi]).length;
          if (len === 0) continue;
          for (const off of new Set([0, Math.min(1, len - 1), len - 1])) {
            const lp = { blockIndex: bi, inlineIndex: 0, offset: off } as LogicalPosition;
            const pos = logicalToPos(base, lp);
            if (pos >= start && pos <= start + oldSize) continue; // touching the change
            const mapped = posToLogical(mutA as ASTDocument, map.map(pos))!;
            const charBefore = docText(base).replace(/\n/g, '')[posCharIndex(base, lp)];
            const charAfter = docText(mutA as ASTDocument).replace(/\n/g, '')[posCharIndex(mutA as ASTDocument, mapped)];
            expect(charAfter, `seed ${seed}: cursor identity @block${bi}+${off}`).toBe(charBefore);
          }
        }
      }

      // TP1 convergence whenever both transforms succeed
      const tb = transformOp(b, a, 'right');
      const ta = transformOp(a, b, 'left');
      if (ta && tb) {
        convergenceChecks++;
        const viaA = applyOp(applyOp(base, a), tb);
        const viaB = applyOp(applyOp(base, b), ta);
        expect(deepEq(viaA, viaB), `seed ${seed}: TP1 divergence\na=${JSON.stringify(a)}\nb=${JSON.stringify(b)}`).toBe(true);
      }
    }
    expect(convergenceChecks).toBeGreaterThan(50); // the fuzz actually exercised TP1
  });
});

/** Char index of a logical position within a doc's concatenated text. */
function posCharIndex(doc: ASTDocument, lp: LogicalPosition): number {
  let idx = 0;
  for (let i = 0; i < lp.blockIndex; i++) idx += blockText(doc[i]).length;
  const content = (lp.itemIndex !== undefined
    ? (doc[lp.blockIndex].content as any[])[lp.itemIndex].content
    : doc[lp.blockIndex].content) as any[];
  if (lp.itemIndex !== undefined) {
    for (let j = 0; j < lp.itemIndex; j++) idx += blockText((doc[lp.blockIndex].content as any[])[j]).length;
  }
  for (let k = 0; k < lp.inlineIndex; k++) idx += content[k].text.length;
  return idx + lp.offset;
}

// ---------------------------------------------------------------------------
// Layer 2: engine marker oracle (insert-only — exact rebase validation)
// ---------------------------------------------------------------------------

describe('fuzz layer 2: engine rebase marker oracle', () => {
  it('undo-all removes exactly the local markers across 80 interleavings', () => {
    const LOCAL = 'abcdefghijkl';
    const REMOTE = 'ABCDEFGHIJKL';
    for (let seed = 1; seed <= 80; seed++) {
      const rnd = mulberry32(seed * 7919);
      const engine = makeEngine();
      engine.document.set([p('....'), p('....'), p('....')] as ASTDocument);
      let l = 0;
      let r = 0;

      for (let step = 0; step < 10; step++) {
        const doc = engine.document();
        const bi = pick(rnd, doc.length);
        const len = blockText(doc[bi]).length;
        const at = pick(rnd, len + 1);
        if (rnd() < 0.5 && l < LOCAL.length) {
          engine.selection.live.set(caretSel(bi, at));
          engine.insertText(LOCAL[l++]);
        } else if (r < REMOTE.length) {
          engine.applyRemoteOperation({
            kind: 'inline',
            blockIndex: bi,
            at,
            removed: [],
            inserted: [{ type: 'text', text: REMOTE[r++] }],
          });
        }
      }

      const preUndo = structuredClone(engine.document());
      let guard = 0;
      while (engine.canUndo() && guard++ < 50) engine.undo();
      const afterUndo = docText(engine.document());

      const ctx = `seed ${seed}: after undo-all "${afterUndo}"`;
      for (let i = 0; i < l; i++) expect(afterUndo.includes(LOCAL[i]), `${ctx} still has local '${LOCAL[i]}'`).toBe(false);
      for (let i = 0; i < r; i++) expect(afterUndo.includes(REMOTE[i]), `${ctx} lost remote '${REMOTE[i]}'`).toBe(true);
      expect((afterUndo.match(/\./g) ?? []).length, `${ctx} base text damaged`).toBe(12);

      guard = 0;
      while (engine.canRedo() && guard++ < 50) engine.redo();
      expect(semanticEq(engine.document(), preUndo), `seed ${seed}: redo-all is not a fixed point`).toBe(true);

      // Round 2: the redone entries were rebased while ON the redo stack —
      // undoing them again must still remove exactly the local markers.
      guard = 0;
      while (engine.canUndo() && guard++ < 50) engine.undo();
      const secondUndo = docText(engine.document());
      for (let i = 0; i < l; i++) {
        expect(secondUndo.includes(LOCAL[i]), `seed ${seed}: 2nd undo-all still has local '${LOCAL[i]}'`).toBe(false);
      }
      for (let i = 0; i < r; i++) {
        expect(secondUndo.includes(REMOTE[i]), `seed ${seed}: 2nd undo-all lost remote '${REMOTE[i]}'`).toBe(true);
      }
    }
  });

  it('a remote insert arriving MID-UNDO rebases the redo stack correctly (40 runs)', () => {
    const LOCAL = 'abcdefgh';
    const REMOTE = 'ABCDEFGH';
    for (let seed = 1; seed <= 40; seed++) {
      const rnd = mulberry32(seed * 31337);
      const engine = makeEngine();
      engine.document.set([p('....'), p('....')] as ASTDocument);
      let l = 0;
      let r = 0;

      // Build some local history.
      for (let step = 0; step < 5 && l < LOCAL.length; step++) {
        const doc = engine.document();
        const bi = pick(rnd, doc.length);
        engine.selection.live.set(caretSel(bi, pick(rnd, blockText(doc[bi]).length + 1)));
        engine.insertText(LOCAL[l++]);
      }
      // Undo part of it (populates the redo stack), then a remote op lands.
      const undos = 1 + pick(rnd, l - 1);
      for (let i = 0; i < undos; i++) engine.undo();
      {
        const doc = engine.document();
        const bi = pick(rnd, doc.length);
        engine.applyRemoteOperation({
          kind: 'inline',
          blockIndex: bi,
          at: pick(rnd, blockText(doc[bi]).length + 1),
          removed: [],
          inserted: [{ type: 'text', text: REMOTE[r++] }],
        });
      }
      // Redo everything the rebase kept, then undo-all: oracle must hold.
      let guard = 0;
      while (engine.canRedo() && guard++ < 20) engine.redo();
      guard = 0;
      while (engine.canUndo() && guard++ < 20) engine.undo();
      const finalText = docText(engine.document());
      const ctx = `seed ${seed}: "${finalText}"`;
      for (let i = 0; i < l; i++) expect(finalText.includes(LOCAL[i]), `${ctx} still has local '${LOCAL[i]}'`).toBe(false);
      for (let i = 0; i < r; i++) expect(finalText.includes(REMOTE[i]), `${ctx} lost remote '${REMOTE[i]}'`).toBe(true);
      expect((finalText.match(/\./g) ?? []).length, `${ctx} base text damaged`).toBe(8);
    }
  });
});

// ---------------------------------------------------------------------------
// Layer 3: engine chaos (all op kinds — structural invariants)
// ---------------------------------------------------------------------------

describe('fuzz layer 3: engine chaos invariants', () => {
  it('never corrupts the document across 60 mixed runs', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const rnd = mulberry32(seed * 104729);
      const engine = makeEngine();
      engine.document.set([p('alpha0'), p('bravo1'), ul(li('itemA'), li('itemB')), p('delta3')] as ASTDocument);

      const localAction = () => {
        const doc = engine.document();
        const textIdxs = doc.map((b, i) => (isText(b) ? i : -1)).filter((i) => i >= 0);
        if (!textIdxs.length) return;
        const bi = textIdxs[pick(rnd, textIdxs.length)];
        const len = blockText(doc[bi]).length;
        const at = pick(rnd, len + 1);
        const roll = rnd();
        if (roll < 0.4) {
          engine.selection.live.set(caretSel(bi, at));
          engine.insertText('x');
        } else if (roll < 0.6) {
          engine.selection.live.set(caretSel(bi, at));
          engine.handleEnter();
        } else if (roll < 0.8) {
          engine.selection.live.set(caretSel(bi, at));
          engine.handleBackspace();
        } else if (len >= 2) {
          const from = pick(rnd, len - 1);
          const to = from + 1 + pick(rnd, len - from - 1);
          engine.selection.live.set({
            start: { blockIndex: bi, inlineIndex: 0, offset: from },
            end: { blockIndex: bi, inlineIndex: 0, offset: to },
            isCollapsed: false,
          } as any);
          engine.deleteRange();
        }
      };

      const remoteAction = () => {
        const doc = engine.document();
        const roll = rnd();
        if (roll < 0.5) {
          const textIdxs = doc.map((b, i) => (isText(b) ? i : -1)).filter((i) => i >= 0);
          if (!textIdxs.length) return;
          const bi = textIdxs[pick(rnd, textIdxs.length)];
          const at = pick(rnd, blockText(doc[bi]).length + 1);
          engine.applyRemoteOperation({ kind: 'inline', blockIndex: bi, at, removed: [], inserted: [{ type: 'text', text: 'R' }] });
        } else if (roll < 0.75) {
          const bi = pick(rnd, doc.length);
          engine.applyRemoteOperation({
            kind: 'block',
            at: bi,
            removed: [structuredClone(doc[bi])],
            inserted: [p('remote' + pick(rnd, 100))],
          });
        } else {
          const pairs = [];
          for (let i = 0; i + 1 < doc.length; i++) if (isText(doc[i]) && isText(doc[i + 1])) pairs.push(i);
          if (!pairs.length) return;
          const bi = pairs[pick(rnd, pairs.length)];
          engine.applyRemoteOperation({
            kind: 'block',
            at: bi,
            removed: [structuredClone(doc[bi]), structuredClone(doc[bi + 1])],
            inserted: [p(blockText(doc[bi]) + blockText(doc[bi + 1]))],
          });
        }
      };

      for (let step = 0; step < 12; step++) {
        expect(() => (rnd() < 0.65 ? localAction() : remoteAction()), `seed ${seed} step ${step}`).not.toThrow();
        const err = validate(engine.document());
        expect(err, `seed ${seed} step ${step}: ${err}`).toBeNull();
      }

      const preUndo = structuredClone(engine.document());
      let guard = 0;
      while (engine.canUndo() && guard++ < 100) {
        expect(() => engine.undo(), `seed ${seed}: undo #${guard}`).not.toThrow();
        const err = validate(engine.document());
        expect(err, `seed ${seed}: undo #${guard}: ${err}`).toBeNull();
      }
      guard = 0;
      while (engine.canRedo() && guard++ < 100) engine.redo();
      expect(semanticEq(engine.document(), preUndo), `seed ${seed}: undo-all/redo-all fixed point`).toBe(true);
    }
  });
});
