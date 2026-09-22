import { normalizeInlineNodes } from './editor-ast.utils';
import { ASTBlockNode, ASTDocument, ASTInlineNode, LogicalSelection } from './editor.types';

export interface BlockSplice {
  kind: 'block';
  at: number;
  removed: ASTBlockNode[];
  inserted: ASTBlockNode[];
}

export interface InlineSplice {
  kind: 'inline';
  blockIndex: number;

  at: number;
  removed: ASTInlineNode[];
  inserted: ASTInlineNode[];
}

/**
 * An op that edits *inside* a component block — a `SheetOp[]` transaction
 * for a sheet block — instead of replacing the block wholesale. Two peers
 * editing the same embedded sheet converge cell by cell through the block
 * type's {@link BlockInnerAlgebra}; a block splice would let one of them lose.
 * `inner` is opaque to the editor; the algebra registered for `type`
 * interprets it.
 */
export interface BlockInnerOp {
  kind: 'block-inner';
  blockIndex: number;
  /** The block type whose algebra interprets `inner` (`'sheet'`). */
  type: string;
  inner: unknown;
  /**
   * The inner op that undoes `inner` against the attrs it was applied to.
   * The engine computes it at apply time (an inverse needs the pre-state),
   * so `invertOp` can stay pure. Absent on an op that was never applied.
   */
  inverse?: unknown;
}

export type EditorOp = BlockSplice | InlineSplice | BlockInnerOp;

/** The algebra a block type supplies so the editor can transform, invert and apply its inner ops. */
export interface BlockInnerAlgebra<Inner = unknown> {
  transform(op: Inner, against: Inner, side: 'left' | 'right'): Inner | null;
  /** The op that undoes `op` when applied to `attrsBefore`. */
  invert(op: Inner, attrsBefore: Record<string, unknown>): Inner;
  /** The attrs after applying `op` — attrs are the block's persisted state. */
  apply(attrs: Record<string, unknown>, op: Inner): Record<string, unknown>;
}

const innerAlgebras = new Map<string, BlockInnerAlgebra>();

/**
 * Register the inner-op algebra for a block type. The engine does this for
 * every registered `BaseComponentBlockBehavior` that carries an
 * `innerAlgebra`; the module-level registry is what lets the pure
 * `transformOp`/`applyOp`/`invertOp` see it.
 */
export function registerBlockInnerAlgebra(type: string, algebra: BlockInnerAlgebra): void {
  innerAlgebras.set(type, algebra);
}

export function blockInnerAlgebra(type: string): BlockInnerAlgebra | undefined {
  return innerAlgebras.get(type);
}

export interface EditorTransaction {

  baseVersion: number;
  op: EditorOp;
  selBefore: LogicalSelection | null;
  selAfter: LogicalSelection | null;
  /**
   * Marks the transactions a single multi-cursor edit produced.
   *
   * Each cursor still contributes its own op, so invert, transform and the
   * whole rebase path keep seeing exactly the single splices they always
   * have — grouping is a history concern only, and undo pops the run in one
   * go. Absent for ordinary single-cursor edits.
   */
  groupId?: number;
}

export function fragLen(nodes: ASTInlineNode[]): number {
  return nodes.reduce((n, x) => n + (x.text?.length ?? 0), 0);
}

export function sliceInline(content: ASTInlineNode[], from: number, to: number): ASTInlineNode[] {
  const out: ASTInlineNode[] = [];
  let pos = 0;
  for (const node of content) {
    const len = node.text?.length ?? 0;
    const s = Math.max(from - pos, 0);
    const e = Math.min(to - pos, len);
    if (s < e) out.push({ ...structuredClone(node), text: node.text.slice(s, e) });
    pos += len;
    if (pos >= to) break;
  }
  return out;
}

export function spliceInlineContent(
  content: ASTInlineNode[],
  at: number,
  removedLen: number,
  inserted: ASTInlineNode[]
): ASTInlineNode[] {
  return normalizeInlineNodes([
    ...sliceInline(content, 0, at),
    ...structuredClone(inserted),
    ...sliceInline(content, at + removedLen, fragLen(content)),
  ]);
}

function isInlineContent(content: unknown): content is ASTInlineNode[] {
  return Array.isArray(content) && content.every((n) => typeof (n as ASTInlineNode)?.text === 'string');
}

function blocksEqual(a: ASTBlockNode, b: ASTBlockNode): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

function flattenChars(content: ASTInlineNode[]): { c: string; k: string }[] {
  const out: { c: string; k: string }[] = [];
  for (const node of content) {
    const k = JSON.stringify(node.marks ?? []);
    const text = node.text ?? '';
    for (let i = 0; i < text.length; i++) out.push({ c: text[i], k });
  }
  return out;
}

function diffInline(oldC: ASTInlineNode[], newC: ASTInlineNode[], blockIndex: number): InlineSplice | null {
  const a = flattenChars(oldC);
  const b = flattenChars(newC);
  let start = 0;
  const minLen = Math.min(a.length, b.length);
  while (start < minLen && a[start].c === b[start].c && a[start].k === b[start].k) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1].c === b[endB - 1].c && a[endA - 1].k === b[endB - 1].k) {
    endA--;
    endB--;
  }
  if (start === endA && start === endB) return null;
  return {
    kind: 'inline',
    blockIndex,
    at: start,
    removed: sliceInline(oldC, start, endA),
    inserted: sliceInline(newC, start, endB),
  };
}

export function diffDocuments(oldDoc: ASTDocument, newDoc: ASTDocument): EditorOp | null {
  let start = 0;
  const minLen = Math.min(oldDoc.length, newDoc.length);
  while (start < minLen && blocksEqual(oldDoc[start], newDoc[start])) start++;

  let endOld = oldDoc.length;
  let endNew = newDoc.length;
  while (endOld > start && endNew > start && blocksEqual(oldDoc[endOld - 1], newDoc[endNew - 1])) {
    endOld--;
    endNew--;
  }

  if (start === endOld && start === endNew) return null;

  if (endOld - start === 1 && endNew - start === 1) {
    const oldBlock = oldDoc[start];
    const newBlock = newDoc[start];
    if (
      oldBlock.type === newBlock.type &&
      JSON.stringify(oldBlock.attrs ?? null) === JSON.stringify(newBlock.attrs ?? null) &&
      isInlineContent(oldBlock.content) &&
      isInlineContent(newBlock.content)
    ) {

      return diffInline(oldBlock.content, newBlock.content, start);
    }
  }

  return {
    kind: 'block',
    at: start,
    removed: structuredClone(oldDoc.slice(start, endOld)),
    inserted: structuredClone(newDoc.slice(start, endNew)),
  };
}

export function invertOp(op: EditorOp): EditorOp {
  if (op.kind === 'block-inner') {
    // An op that never carried its inverse cannot be undone; keep it as is
    // rather than invent one.
    return op.inverse === undefined ? op : { ...op, inner: op.inverse, inverse: op.inner };
  }
  return { ...op, removed: op.inserted, inserted: op.removed } as EditorOp;
}

export function applyOp(doc: ASTDocument, op: EditorOp): ASTDocument {
  if (op.kind === 'block') {
    return [...doc.slice(0, op.at), ...structuredClone(op.inserted), ...doc.slice(op.at + op.removed.length)];
  }
  if (op.kind === 'block-inner') {
    const block = doc[op.blockIndex];
    const algebra = blockInnerAlgebra(op.type);
    if (!block || block.type !== op.type || !algebra) return doc;
    const next = [...doc];
    next[op.blockIndex] = { ...block, attrs: algebra.apply(block.attrs ?? {}, op.inner) };
    return next;
  }
  const block = doc[op.blockIndex];
  if (!block || !isInlineContent(block.content)) return doc;
  const content = spliceInlineContent(block.content, op.at, fragLen(op.removed), op.inserted);
  const next = [...doc];
  next[op.blockIndex] = { ...block, content };
  return next;
}

interface Splice<T> {
  at: number;
  removed: T[];
  inserted: T[];
}

/**
 * Two splices whose ranges strictly overlap (an insertion strictly inside the other's range counts) cannot
 * be shifted past each other, so `op` is rewritten into one splice over the whole region as it stands after
 * `against`, with content both peers compute identically — the pair converges (TP1) instead of each side
 * dropping the other's edit. When both replaced something, the `left` op's insertion stands alone (two
 * concurrent splits of one block do not both apply); when at least one only inserted, both insertions
 * survive in order of position (`left` first on a tie) and the union of the removed ranges is gone. The
 * region's original content is reassembled from the two `removed` copies, so the result inverts cleanly.
 */
function resolveOverlap<T>(op: Splice<T>, against: Splice<T>, side: 'left' | 'right', slice: (items: T[], from: number, to: number) => T[], len: (items: T[]) => number): Splice<T> {
  const os = op.at;
  const oe = os + len(op.removed);
  const as = against.at;
  const ae = as + len(against.removed);
  const s = Math.min(os, as);
  const e = Math.max(oe, ae);
  const points = [...new Set([s, os, oe, as, ae, e])].sort((a, b) => a - b);
  const original: T[] = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const [x, y] = [points[i], points[i + 1]];
    original.push(...(os <= x && y <= oe ? slice(op.removed, x - os, y - os) : slice(against.removed, x - as, y - as)));
  }
  const removed = [...slice(original, 0, as - s), ...structuredClone(against.inserted), ...slice(original, ae - s, e - s)];
  const conflict = len(op.removed) > 0 && len(against.removed) > 0;
  const opFirst = os < as || (os === as && side === 'left');
  const inserted = conflict
    ? side === 'left'
      ? op.inserted
      : structuredClone(against.inserted)
    : opFirst
      ? [...op.inserted, ...structuredClone(against.inserted)]
      : [...structuredClone(against.inserted), ...op.inserted];
  return { at: s, removed, inserted };
}

function shiftIndex(
  opStart: number,
  opRemovedLen: number,
  aStart: number,
  aRemovedLen: number,
  aInsertedLen: number,
  side: 'left' | 'right'
): number | null {
  const aEnd = aStart + aRemovedLen;
  const opEnd = opStart + opRemovedLen;
  const delta = aInsertedLen - aRemovedLen;
  if (aEnd < opStart) return opStart + delta;
  if (aEnd === opStart) {
    if (aStart === opStart) {

      if (opRemovedLen === 0) return side === 'right' ? opStart + delta : opStart;
      return opStart + delta;
    }
    return opStart + delta;
  }
  if (opEnd <= aStart) return opStart;
  return null;
}

export function transformOp(op: EditorOp, against: EditorOp, side: 'left' | 'right' = 'left'): EditorOp | null {
  if (against.kind === 'block') {
    const delta = against.inserted.length - against.removed.length;
    if (op.kind === 'block') {
      const at = shiftIndex(op.at, op.removed.length, against.at, against.removed.length, against.inserted.length, side);
      if (at === null) return { ...op, ...resolveOverlap(op, against, side, (items, from, to) => items.slice(from, to), (items) => items.length) };
      return at === op.at ? op : { ...op, at };
    }

    // Inline and inner ops address one block: it moves with the splice, or
    // is gone (or replaced wholesale) when the splice removed it.
    const aEnd = against.at + against.removed.length;
    if (aEnd <= op.blockIndex) return delta === 0 ? op : { ...op, blockIndex: op.blockIndex + delta };
    if (op.blockIndex < against.at) return op;
    return null;
  }

  if (against.kind === 'block-inner') {
    if (op.kind === 'inline') return op;
    if (op.kind === 'block-inner') {
      if (op.blockIndex !== against.blockIndex || op.type !== against.type) return op;
      const algebra = blockInnerAlgebra(op.type);
      if (!algebra) return op;
      const inner = algebra.transform(op.inner, against.inner, side);
      if (inner === null) return null;
      // The inverse rides along, transformed the same way — the ladder the
      // sheet's own history runs; exact for disjoint edits, best-effort for
      // a tie on the same cell.
      const inverse = op.inverse === undefined ? undefined : algebra.transform(op.inverse, against.inner, side);
      return { ...op, inner, ...(inverse === null || inverse === undefined ? { inverse: undefined } : { inverse }) };
    }
    // A splice that removes the block the inner op edited: patch the stale
    // removed block so a later invert re-inserts it as the peer last saw it.
    if (against.blockIndex >= op.at && against.blockIndex < op.at + op.removed.length) {
      const idx = against.blockIndex - op.at;
      const stale = op.removed[idx];
      const algebra = blockInnerAlgebra(against.type);
      if (stale.type === against.type && algebra) {
        const removed = [...op.removed];
        removed[idx] = { ...stale, attrs: algebra.apply(stale.attrs ?? {}, against.inner) };
        return { ...op, removed };
      }
    }
    return op;
  }

  if (op.kind === 'inline') {
    if (op.blockIndex !== against.blockIndex) return op;
    const at = shiftIndex(op.at, fragLen(op.removed), against.at, fragLen(against.removed), fragLen(against.inserted), side);
    if (at === null) return { ...op, ...resolveOverlap(op, against, side, sliceInline, fragLen) };
    return at === op.at ? op : { ...op, at };
  }

  if (op.kind === 'block-inner') return op;

  if (against.blockIndex >= op.at && against.blockIndex < op.at + op.removed.length) {
    const idx = against.blockIndex - op.at;
    const stale = op.removed[idx];
    if (isInlineContent(stale.content)) {
      const removed = [...op.removed];
      removed[idx] = {
        ...stale,
        content: spliceInlineContent(stale.content, against.at, fragLen(against.removed), against.inserted),
      };
      return { ...op, removed };
    }
  }
  return op;
}

export function rebaseOp(op: EditorOp, against: EditorOp[], side: 'left' | 'right' = 'left'): EditorOp | null {
  let current: EditorOp | null = op;
  for (const a of against) {
    if (!current) return null;
    current = transformOp(current, a, side);
  }
  return current;
}
