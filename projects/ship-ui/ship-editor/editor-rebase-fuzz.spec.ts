// @vitest-environment jsdom

import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { diffFlat, logicalToPos, posToLogical } from './editor-flat-positions';
import { normalizeInlineNodes } from './editor-ast.utils';
import { EditorOp, applyOp, diffDocuments, invertOp, transformOp } from './editor-transactions';
import { ASTBlockNode, ASTDocument, LogicalPosition } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { BulletListBehavior, ListItemBehavior, ParagraphBehavior } from './standard-behaviors';

const SCALE = Math.max(1, Number(globalThis.process?.env?.['FUZZ_SCALE'] ?? 1) || 1);

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

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const li = (text: string) => ({ type: 'list-item', content: [{ type: 'text', text }] });
const ul = (...items: any[]) => ({ type: 'bullet-list', content: items });
const hr = () => ({ type: 'hr', content: [] });

const isText = (b: any) => Array.isArray(b.content) && b.content.length > 0 && typeof b.content[0]?.text === 'string';
const blockText = (b: any): string =>
  isText(b) ? b.content.map((n: any) => n.text).join('') : (b.content ?? []).map(blockText).join('');
const docText = (doc: ASTDocument) => doc.map(blockText).join('\n');
const deepEq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

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

function validate(doc: ASTDocument): string | null {
  if (!Array.isArray(doc) || doc.length === 0) return 'empty document';
  for (const block of doc) {
    if (!block?.type) return 'block without type';
    const c = block.content as any[];
    if (!Array.isArray(c)) return `non-array content in ${block.type}`;
    if (c.length === 0) continue;
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

const caretSel = (doc: ASTDocument, blockIndex: number, offset: number) => {
  const at = logicalToPos(doc, { blockIndex, inlineIndex: 0, offset });
  return { from: at, to: at };
};

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

function randomMutation(rnd: Rnd, doc: ASTDocument): ASTDocument | null {
  const kind = pick(rnd, 5);
  const textIdxs = doc.map((b, i) => (isText(b) ? i : -1)).filter((i) => i >= 0);
  const cloned = structuredClone(doc) as any[];
  switch (kind) {
    case 0: {

      if (!textIdxs.length) return null;
      const bi = textIdxs[pick(rnd, textIdxs.length)];
      const t = blockText(cloned[bi]);
      const at = pick(rnd, t.length + 1);
      cloned[bi] = p(t.slice(0, at) + 'INS' + t.slice(at));
      return cloned;
    }
    case 1: {

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

      const bi = pick(rnd, cloned.length);
      cloned[bi] = p('REPL' + pick(rnd, 100));
      return cloned;
    }
    case 3: {

      if (!textIdxs.length) return null;
      const bi = textIdxs[pick(rnd, textIdxs.length)];
      const t = blockText(cloned[bi]);
      const at = pick(rnd, t.length + 1);
      cloned.splice(bi, 1, p(t.slice(0, at)), p(t.slice(at)));
      return cloned;
    }
    default: {

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
    for (let seed = 1; seed <= 400 * SCALE; seed++) {
      const rnd = mulberry32(seed);
      const base = randomBaseDoc(rnd);
      const mutA = randomMutation(rnd, base);
      const mutB = randomMutation(rnd, base);
      if (!mutA || !mutB) continue;
      const a = diffDocuments(base, mutA);
      const b = diffDocuments(base, mutB);
      if (!a || !b) continue;

      expect(deepEq(applyOp(base, a), mutA), `seed ${seed}: applyOp(a)`).toBe(true);
      expect(deepEq(applyOp(base, b), mutB), `seed ${seed}: applyOp(b)`).toBe(true);

      expect(deepEq(applyOp(mutA as ASTDocument, invertOp(a)), base), `seed ${seed}: invert(a)`).toBe(true);

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
            if (pos >= start && pos <= start + oldSize) continue;
            const mapped = posToLogical(mutA as ASTDocument, map.map(pos))!;
            const charBefore = docText(base).replace(/\n/g, '')[posCharIndex(base, lp)];
            const charAfter = docText(mutA as ASTDocument).replace(/\n/g, '')[posCharIndex(mutA as ASTDocument, mapped)];
            expect(charAfter, `seed ${seed}: cursor identity @block${bi}+${off}`).toBe(charBefore);
          }
        }
      }

      const tb = transformOp(b, a, 'right');
      const ta = transformOp(a, b, 'left');
      if (ta && tb) {
        convergenceChecks++;
        const viaA = applyOp(applyOp(base, a), tb);
        const viaB = applyOp(applyOp(base, b), ta);
        expect(deepEq(viaA, viaB), `seed ${seed}: TP1 divergence\na=${JSON.stringify(a)}\nb=${JSON.stringify(b)}`).toBe(true);
      }
    }
    expect(convergenceChecks).toBeGreaterThan(50);
  });
});

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

describe('fuzz layer 2: engine rebase marker oracle', () => {
  it('undo-all removes exactly the local markers across 80 interleavings', () => {
    const LOCAL = 'abcdefghijkl';
    const REMOTE = 'ABCDEFGHIJKL';
    for (let seed = 1; seed <= 80 * SCALE; seed++) {
      const rnd = mulberry32(seed * 7919);
      const engine = makeEngine();
      engine.load([p('....'), p('....'), p('....')] as ASTDocument);
      let l = 0;
      let r = 0;

      for (let step = 0; step < 10; step++) {
        const doc = engine.document();
        const bi = pick(rnd, doc.length);
        const len = blockText(doc[bi]).length;
        const at = pick(rnd, len + 1);
        if (rnd() < 0.5 && l < LOCAL.length) {
          engine.selection.live.set(caretSel(doc, bi, at));
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
    for (let seed = 1; seed <= 40 * SCALE; seed++) {
      const rnd = mulberry32(seed * 31337);
      const engine = makeEngine();
      engine.load([p('....'), p('....')] as ASTDocument);
      let l = 0;
      let r = 0;

      for (let step = 0; step < 5 && l < LOCAL.length; step++) {
        const doc = engine.document();
        const bi = pick(rnd, doc.length);
        engine.selection.live.set(caretSel(doc, bi, pick(rnd, blockText(doc[bi]).length + 1)));
        engine.insertText(LOCAL[l++]);
      }

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

describe('fuzz layer 3: engine chaos invariants', () => {
  it('never corrupts the document across 60 mixed runs', () => {
    for (let seed = 1; seed <= 60 * SCALE; seed++) {
      const rnd = mulberry32(seed * 104729);
      const engine = makeEngine();
      engine.load([p('alpha0'), p('bravo1'), ul(li('itemA'), li('itemB')), p('delta3')] as ASTDocument);

      const localAction = () => {
        const doc = engine.document();
        const textIdxs = doc.map((b, i) => (isText(b) ? i : -1)).filter((i) => i >= 0);
        if (!textIdxs.length) return;
        const bi = textIdxs[pick(rnd, textIdxs.length)];
        const len = blockText(doc[bi]).length;
        const at = pick(rnd, len + 1);
        const roll = rnd();
        if (roll < 0.4) {
          engine.selection.live.set(caretSel(doc, bi, at));
          engine.insertText('x');
        } else if (roll < 0.6) {
          engine.selection.live.set(caretSel(doc, bi, at));
          engine.handleEnter();
        } else if (roll < 0.8) {
          engine.selection.live.set(caretSel(doc, bi, at));
          engine.handleBackspace();
        } else if (len >= 2) {
          const from = pick(rnd, len - 1);
          const to = from + 1 + pick(rnd, len - from - 1);
          engine.selection.live.set({
            from: logicalToPos(doc, { blockIndex: bi, inlineIndex: 0, offset: from }),
            to: logicalToPos(doc, { blockIndex: bi, inlineIndex: 0, offset: to }),
          });
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