import { resolveInlinePosition } from './editor-ast.utils';
import { ASTBlockNode, ASTDocument, ASTInlineNode, LogicalPosition } from './editor.types';

type BlockShape = 'text' | 'container' | 'void';

function shapeOf(block: ASTBlockNode): BlockShape {
  const content = block.content as unknown[];
  if (!content || content.length === 0) return 'void';
  if (typeof (content[0] as ASTInlineNode)?.text === 'string') return 'text';
  return 'container';
}

function textLen(content: ASTInlineNode[]): number {
  return content.reduce((n, x) => n + (x.text?.length ?? 0), 0);
}

export function nodeSize(block: ASTBlockNode): number {
  const shape = shapeOf(block);
  if (shape === 'void') return 1;
  if (shape === 'text') return 2 + textLen(block.content as ASTInlineNode[]);
  return 2 + (block.content as ASTBlockNode[]).reduce((n, item) => n + nodeSize(item), 0);
}

export function docSize(doc: ASTDocument): number {
  return doc.reduce((n, b) => n + nodeSize(b), 0);
}

export function logicalToPos(doc: ASTDocument, lp: LogicalPosition): number {
  let pos = 0;

  for (let i = 0; i < lp.blockIndex && i < doc.length; i++) pos += nodeSize(doc[i]);
  const block = doc[lp.blockIndex];
  if (!block) return pos;
  const shape = shapeOf(block);
  if (shape === 'void') return pos;

  pos += 1;
  let content = block.content as ASTInlineNode[];
  if (shape === 'container') {
    const items = block.content as ASTBlockNode[];
    const itemIndex = lp.itemIndex ?? 0;
    for (let j = 0; j < itemIndex; j++) pos += nodeSize(items[j]);
    pos += 1;
    content = (items[itemIndex]?.content ?? []) as ASTInlineNode[];
  }
  for (let k = 0; k < lp.inlineIndex; k++) pos += content[k]?.text?.length ?? 0;
  return pos + lp.offset;
}

export function posToLogical(doc: ASTDocument, pos: number): LogicalPosition | null {
  let p = pos;
  for (let bi = 0; bi < doc.length; bi++) {
    const block = doc[bi];
    const size = nodeSize(block);
    const shape = shapeOf(block);
    const isLast = bi === doc.length - 1;
    if (p >= size && !isLast) {
      p -= size;
      continue;
    }
    if (shape === 'void') return { blockIndex: bi, inlineIndex: 0, offset: 0 };

    if (shape === 'text') {
      const content = block.content as ASTInlineNode[];
      const charOffset = Math.max(0, Math.min(p - 1, textLen(content)));
      return { blockIndex: bi, ...resolveInlinePosition(content, charOffset) };
    }

    const items = block.content as ASTBlockNode[];
    let q = Math.max(0, p - 1);
    for (let ii = 0; ii < items.length; ii++) {
      const itemSize = nodeSize(items[ii]);
      const lastItem = ii === items.length - 1;
      if (q >= itemSize && !lastItem) {
        q -= itemSize;
        continue;
      }
      const content = (items[ii].content ?? []) as ASTInlineNode[];
      const charOffset = Math.max(0, Math.min(q - 1, textLen(content)));
      return { blockIndex: bi, itemIndex: ii, ...resolveInlinePosition(content, charOffset) };
    }
    return { blockIndex: bi, itemIndex: 0, inlineIndex: 0, offset: 0 };
  }
  return null;
}

export interface MapResult {
  pos: number;

  deleted: boolean;
}

export class StepMap {
  constructor(readonly ranges: ReadonlyArray<readonly [number, number, number]>) {}

  mapResult(pos: number, assoc: -1 | 1 = 1): MapResult {
    let diff = 0;
    for (const [start, oldSize, newSize] of this.ranges) {
      if (start > pos) break;
      const end = start + oldSize;
      if (pos <= end) {
        const side = !oldSize ? assoc : pos === start ? -1 : pos === end ? 1 : assoc;
        return { pos: start + diff + (side < 0 ? 0 : newSize), deleted: pos > start && pos < end };
      }
      diff += newSize - oldSize;
    }
    return { pos: pos + diff, deleted: false };
  }

  map(pos: number, assoc: -1 | 1 = 1): number {
    return this.mapResult(pos, assoc).pos;
  }

  invert(): StepMap {
    let diff = 0;
    const out: [number, number, number][] = [];
    for (const [start, oldSize, newSize] of this.ranges) {
      out.push([start + diff, newSize, oldSize]);
      diff += newSize - oldSize;
    }
    return new StepMap(out);
  }
}

/**
 * The document is compared as a stream of tokens — one per block delimiter and
 * one per character — but the stream is never materialised.
 *
 * Building it allocated a string per character, which measured 19.8 ms for a
 * single remote operation on a 1000-block document. The functions below walk the
 * same stream with cursors instead, so the comparison costs no allocation and
 * short-circuits on reference-equal blocks — which is most of them, since
 * `applyOp` shares everything it did not touch.
 */

function attrsEqual(a: ASTBlockNode, b: ASTBlockNode): boolean {
  const x = a.attrs;
  const y = b.attrs;
  if (x === y) return true;
  if (!x || !y) return !x && !y;
  const kx = Object.keys(x);
  const ky = Object.keys(y);
  if (kx.length !== ky.length) return false;
  for (const key of kx) if (x[key] !== y[key]) return false;
  return true;
}

function marksEqual(a: ASTInlineNode, b: ASTInlineNode): boolean {
  const x = a.marks;
  const y = b.marks;
  if (x === y) return true;
  const lx = x?.length ?? 0;
  const ly = y?.length ?? 0;
  if (lx !== ly) return false;
  for (let i = 0; i < lx; i++) {
    const mx = x![i];
    const my = y![i];
    if (mx.type !== my.type) return false;
    const ax = mx.attrs;
    const ay = my.attrs;
    if (ax === ay) continue;
    if (!ax || !ay) return false;
    const keys = Object.keys(ax);
    if (keys.length !== Object.keys(ay).length) return false;
    for (const key of keys) if (ax[key] !== ay[key]) return false;
  }
  return true;
}

/**
 * Walks a text block's characters across its inline runs in either direction,
 * carrying the run each character came from so marks can be compared without
 * rescanning. Rescanning from the start per character would make the comparison
 * quadratic inside a block, which matters for large pasted paragraphs.
 */
class CharCursor {
  #content: ASTInlineNode[];
  #node = 0;
  #offset = 0;
  #forward: boolean;

  constructor(content: ASTInlineNode[], forward: boolean) {
    this.#content = content;
    this.#forward = forward;
    if (forward) {
      this.#node = 0;
      this.#offset = 0;
      this.#skipEmptyForward();
    } else {
      this.#node = content.length - 1;
      this.#offset = (content[this.#node]?.text?.length ?? 0) - 1;
      this.#skipEmptyBackward();
    }
  }

  #skipEmptyForward() {
    while (this.#node < this.#content.length && this.#offset >= (this.#content[this.#node].text?.length ?? 0)) {
      this.#node++;
      this.#offset = 0;
    }
  }

  #skipEmptyBackward() {
    while (this.#node >= 0 && this.#offset < 0) {
      this.#node--;
      this.#offset = (this.#content[this.#node]?.text?.length ?? 0) - 1;
    }
  }

  get done(): boolean {
    return this.#forward ? this.#node >= this.#content.length : this.#node < 0;
  }
  get char(): string {
    return this.#content[this.#node].text[this.#offset];
  }
  get run(): ASTInlineNode {
    return this.#content[this.#node];
  }
  next() {
    if (this.#forward) {
      this.#offset++;
      this.#skipEmptyForward();
    } else {
      this.#offset--;
      this.#skipEmptyBackward();
    }
  }
}

/** Leading (or trailing) characters two text blocks share, comparing marks per run. */
function sharedChars(a: ASTInlineNode[], b: ASTInlineNode[], forward: boolean): number {
  const ca = new CharCursor(a, forward);
  const cb = new CharCursor(b, forward);
  let shared = 0;
  while (!ca.done && !cb.done) {
    if (ca.char !== cb.char || !marksEqual(ca.run, cb.run)) break;
    ca.next();
    cb.next();
    shared++;
  }
  return shared;
}

/** How many leading tokens two blocks share, and whether that covers both entirely. */
function sharedPrefix(a: ASTBlockNode, b: ASTBlockNode): { tokens: number; whole: boolean } {
  if (a === b) return { tokens: nodeSize(a), whole: true };
  // The opening token is `o:type:attrs`, so both have to match before anything
  // inside the block can.
  if (a.type !== b.type || !attrsEqual(a, b)) return { tokens: 0, whole: false };

  const shapeA = shapeOf(a);
  const shapeB = shapeOf(b);
  // A void block is a single `v:` token, which never matches an `o:` token.
  if (shapeA === 'void' || shapeB === 'void') {
    return shapeA === shapeB ? { tokens: 1, whole: true } : { tokens: 0, whole: false };
  }
  // Two non-void blocks share their opening token even if their shapes diverge.
  if (shapeA !== shapeB) return { tokens: 1, whole: false };

  if (shapeA === 'text') {
    const ca = a.content as ASTInlineNode[];
    const cb = b.content as ASTInlineNode[];
    const la = textLen(ca);
    const lb = textLen(cb);
    const i = sharedChars(ca, cb, true);
    const whole = i === la && i === lb;
    return { tokens: 1 + i + (whole ? 1 : 0), whole };
  }

  const ia = a.content as ASTBlockNode[];
  const ib = b.content as ASTBlockNode[];
  let total = 1;
  let k = 0;
  while (k < ia.length && k < ib.length) {
    const child = sharedPrefix(ia[k], ib[k]);
    total += child.tokens;
    if (!child.whole) return { tokens: total, whole: false };
    k++;
  }
  const whole = k === ia.length && k === ib.length;
  return { tokens: total + (whole ? 1 : 0), whole };
}

/** How many trailing tokens two blocks share, and whether that covers both entirely. */
function sharedSuffix(a: ASTBlockNode, b: ASTBlockNode): { tokens: number; whole: boolean } {
  if (a === b) return { tokens: nodeSize(a), whole: true };
  // Walking backwards the first token is `c:type`, which carries no attrs — so
  // two blocks can share a suffix while differing in their attributes.
  if (a.type !== b.type) return { tokens: 0, whole: false };

  const shapeA = shapeOf(a);
  const shapeB = shapeOf(b);
  if (shapeA === 'void' || shapeB === 'void') {
    return shapeA === shapeB && attrsEqual(a, b) ? { tokens: 1, whole: true } : { tokens: 0, whole: false };
  }
  if (shapeA !== shapeB) return { tokens: 1, whole: false };
  // Reaching the opening token also requires the attrs to match.
  const openMatches = attrsEqual(a, b);

  if (shapeA === 'text') {
    const ca = a.content as ASTInlineNode[];
    const cb = b.content as ASTInlineNode[];
    const la = textLen(ca);
    const lb = textLen(cb);
    const i = sharedChars(ca, cb, false);
    const whole = i === la && i === lb && openMatches;
    return { tokens: 1 + i + (whole ? 1 : 0), whole };
  }

  const ia = a.content as ASTBlockNode[];
  const ib = b.content as ASTBlockNode[];
  let total = 1;
  let k = 0;
  while (k < ia.length && k < ib.length) {
    const child = sharedSuffix(ia[ia.length - 1 - k], ib[ib.length - 1 - k]);
    total += child.tokens;
    if (!child.whole) return { tokens: total, whole: false };
    k++;
  }
  const whole = k === ia.length && k === ib.length && openMatches;
  return { tokens: total + (whole ? 1 : 0), whole };
}

export function diffFlat(oldDoc: ASTDocument, newDoc: ASTDocument): StepMap | null {
  const lenA = docSize(oldDoc);
  const lenB = docSize(newDoc);

  // Longest common prefix, in tokens.
  let start = 0;
  for (let i = 0; i < oldDoc.length && i < newDoc.length; i++) {
    const shared = sharedPrefix(oldDoc[i], newDoc[i]);
    start += shared.tokens;
    if (!shared.whole) break;
  }
  if (start > lenA) start = lenA;
  if (start > lenB) start = lenB;

  // Longest common suffix, in tokens, without crossing the prefix.
  let suffix = 0;
  const maxSuffix = Math.min(lenA - start, lenB - start);
  for (let i = 0; i < oldDoc.length && i < newDoc.length; i++) {
    const shared = sharedSuffix(oldDoc[oldDoc.length - 1 - i], newDoc[newDoc.length - 1 - i]);
    suffix += shared.tokens;
    if (!shared.whole) break;
  }
  if (suffix > maxSuffix) suffix = maxSuffix;

  const endA = lenA - suffix;
  const endB = lenB - suffix;
  if (start === endA && start === endB) return null;
  return new StepMap([[start, endA - start, endB - start]]);
}

export function stepMapFromOp(
  oldDoc: ASTDocument,
  op:
    | { kind: 'block'; at: number; removed: ASTBlockNode[]; inserted: ASTBlockNode[] }
    | { kind: 'inline'; blockIndex: number; at: number; removed: ASTInlineNode[]; inserted: ASTInlineNode[] }
): StepMap {
  if (op.kind === 'inline') {
    let start = 0;
    for (let i = 0; i < op.blockIndex; i++) start += nodeSize(oldDoc[i]);
    start += 1 + op.at;
    return new StepMap([[start, textLen(op.removed), textLen(op.inserted)]]);
  }
  let start = 0;
  for (let i = 0; i < op.at; i++) start += nodeSize(oldDoc[i]);
  const oldSize = op.removed.reduce((n, b) => n + nodeSize(b), 0);
  const newSize = op.inserted.reduce((n, b) => n + nodeSize(b), 0);
  return new StepMap([[start, oldSize, newSize]]);
}
