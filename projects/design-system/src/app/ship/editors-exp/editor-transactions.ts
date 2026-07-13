import { normalizeInlineNodes } from './editor-ast.utils';
import { ASTBlockNode, ASTDocument, ASTInlineNode, LogicalSelection } from './editor.types';

/**
 * Invertible, transformable editor operations.
 *
 * Two-level operation model:
 *
 * - **BlockSplice** — "at block index `at`, `removed` blocks became `inserted`".
 *   Used for structural edits (split, merge, block-type change, reset).
 * - **InlineSplice** — "inside block `blockIndex`, at character offset `at`,
 *   this inline fragment became that one". Used whenever an edit stays inside a
 *   single text block — typing, deleting, mark toggles. Fragments are
 *   `ASTInlineNode[]`, so marks survive; offsets are UTF-16 code units in the
 *   block's flattened text (the same space `LogicalPosition.offset` lives in).
 *
 * Every op is invertible (swap removed/inserted) and plain JSON, so it can ship
 * over a wire verbatim. `transformOp(op, against, side)` is the OT primitive:
 * it rewrites `op` as if `against` had been applied first, returning null on a
 * genuine overlap conflict (same characters / same blocks touched — the caller
 * must then resolve, e.g. drop the op or fall back to a fresh diff). For two
 * ops a/b produced concurrently from the same document, non-conflicting pairs
 * converge: apply(apply(d,a), transform(b,a,'right')) ===
 * apply(apply(d,b), transform(a,b,'left')) — pinned by tests.
 *
 * What a realtime sync layer still adds on top: sequence rebasing (the
 * transform ladder over op *lists*), server ordering / acknowledgement, and a
 * conflict policy for the null cases. The per-op algebra below is the part
 * both an OT and a CRDT-flavored design need either way.
 */

/** Replace `removed.length` blocks at `at` with `inserted`. */
export interface BlockSplice {
  kind: 'block';
  at: number;
  removed: ASTBlockNode[];
  inserted: ASTBlockNode[];
}

/** Replace a character range inside one text block with an inline fragment. */
export interface InlineSplice {
  kind: 'inline';
  blockIndex: number;
  /** Character offset (UTF-16 units) in the block's flattened text. */
  at: number;
  removed: ASTInlineNode[];
  inserted: ASTInlineNode[];
}

export type EditorOp = BlockSplice | InlineSplice;

/** One committed edit: the op plus caret context for undo/redo restore. */
export interface EditorTransaction {
  /** Document version this op applies on top of (monotonic, per engine). */
  baseVersion: number;
  op: EditorOp;
  selBefore: LogicalSelection | null;
  selAfter: LogicalSelection | null;
}

// ---------------------------------------------------------------------------
// Inline fragment helpers
// ---------------------------------------------------------------------------

/** Total character length of an inline fragment. */
export function fragLen(nodes: ASTInlineNode[]): number {
  return nodes.reduce((n, x) => n + (x.text?.length ?? 0), 0);
}

/** Extract [from, to) of a block's inline content as a fragment, marks intact. */
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

/** Replace `removedLen` characters at `at` with `inserted`, renormalized. */
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

/** Text block whose content is inline nodes (not a container/void block). */
function isInlineContent(content: unknown): content is ASTInlineNode[] {
  return Array.isArray(content) && content.every((n) => typeof (n as ASTInlineNode)?.text === 'string');
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

/** Structural block equality — reference check first (transforms share untouched
 * block objects), JSON comparison as the safety net when they don't. */
function blocksEqual(a: ASTBlockNode, b: ASTBlockNode): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/** Flatten inline content to per-character (char, markKey) pairs. */
function flattenChars(content: ASTInlineNode[]): { c: string; k: string }[] {
  const out: { c: string; k: string }[] = [];
  for (const node of content) {
    const k = JSON.stringify(node.marks ?? []);
    const text = node.text ?? '';
    for (let i = 0; i < text.length; i++) out.push({ c: text[i], k });
  }
  return out;
}

/** Char-level diff of one text block's content, or null when equivalent. */
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
  if (start === endA && start === endB) return null; // equivalent (maybe different node structure)
  return {
    kind: 'inline',
    blockIndex,
    at: start,
    removed: sliceInline(oldC, start, endA),
    inserted: sliceInline(newC, start, endB),
  };
}

/**
 * Diff two documents into the minimal operation, or null when equivalent.
 *
 * Block-level common prefix/suffix are peeled off first. When the remaining
 * window is a single same-type/same-attrs text block on both sides, the diff
 * refines to a character-level InlineSplice — so plain typing stores the
 * changed characters, not the whole block. Everything else (splits, merges,
 * type/attr changes, void/container blocks) stays a BlockSplice.
 */
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

  if (start === endOld && start === endNew) return null; // identical

  if (endOld - start === 1 && endNew - start === 1) {
    const oldBlock = oldDoc[start];
    const newBlock = newDoc[start];
    if (
      oldBlock.type === newBlock.type &&
      JSON.stringify(oldBlock.attrs ?? null) === JSON.stringify(newBlock.attrs ?? null) &&
      isInlineContent(oldBlock.content) &&
      isInlineContent(newBlock.content)
    ) {
      // Same block, same shape — refine to a char-level op. A null here means
      // the contents are equivalent modulo node structure: a semantic no-op.
      return diffInline(oldBlock.content, newBlock.content, start);
    }
  }

  // Clone the stored blocks so later in-place mutations of the live doc can
  // never corrupt history.
  return {
    kind: 'block',
    at: start,
    removed: structuredClone(oldDoc.slice(start, endOld)),
    inserted: structuredClone(newDoc.slice(start, endNew)),
  };
}

// ---------------------------------------------------------------------------
// Invert / apply
// ---------------------------------------------------------------------------

/** The exact inverse operation: applying it after the original is a no-op. */
export function invertOp(op: EditorOp): EditorOp {
  return { ...op, removed: op.inserted, inserted: op.removed } as EditorOp;
}

/** Apply an op, returning a new document (inserted content cloned in — history
 * stays isolated from the live document). */
export function applyOp(doc: ASTDocument, op: EditorOp): ASTDocument {
  if (op.kind === 'block') {
    return [...doc.slice(0, op.at), ...structuredClone(op.inserted), ...doc.slice(op.at + op.removed.length)];
  }
  const block = doc[op.blockIndex];
  if (!block || !isInlineContent(block.content)) return doc; // op no longer applies
  const content = spliceInlineContent(block.content, op.at, fragLen(op.removed), op.inserted);
  const next = [...doc];
  next[op.blockIndex] = { ...block, content };
  return next;
}

// ---------------------------------------------------------------------------
// Transform (the OT primitive)
// ---------------------------------------------------------------------------

/**
 * Shift an operation's start index as if a concurrent splice [aStart,
 * aStart+aRemovedLen)→aInsertedLen had been applied first. Returns null when
 * the two ranges genuinely overlap. `side` breaks the tie for two insertions
 * at the same point ('left' keeps the op first, 'right' moves it after).
 */
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
      // `against` is a pure insertion exactly at op's start. Only when op is
      // ALSO a pure insertion is this a genuine ordering tie for `side` to
      // break; if op removes content, a concurrent insert can never sit inside
      // its removal range, so the range shifts after the insert. (The fuzz
      // found the TP1 divergence: merge-at-1 vs insert-at-1 must converge.)
      if (opRemovedLen === 0) return side === 'right' ? opStart + delta : opStart;
      return opStart + delta;
    }
    return opStart + delta; // against's removal ends exactly where op starts
  }
  if (opEnd <= aStart) return opStart;
  return null; // overlap
}

/**
 * Rewrite `op` so it applies to a document where `against` (produced
 * concurrently from the same base document) has already been applied.
 * Returns null on an overlap conflict the algebra can't resolve.
 */
export function transformOp(op: EditorOp, against: EditorOp, side: 'left' | 'right' = 'left'): EditorOp | null {
  if (against.kind === 'block') {
    const delta = against.inserted.length - against.removed.length;
    if (op.kind === 'block') {
      const at = shiftIndex(op.at, op.removed.length, against.at, against.removed.length, against.inserted.length, side);
      if (at === null) return null;
      return at === op.at ? op : { ...op, at };
    }
    // inline op vs block splice: survives only if its block wasn't replaced.
    const aEnd = against.at + against.removed.length;
    if (aEnd <= op.blockIndex) return delta === 0 ? op : { ...op, blockIndex: op.blockIndex + delta };
    if (op.blockIndex < against.at) return op;
    return null; // the block this op edits was removed/replaced
  }

  // against is inline
  if (op.kind === 'inline') {
    if (op.blockIndex !== against.blockIndex) return op; // different blocks — independent
    const at = shiftIndex(op.at, fragLen(op.removed), against.at, fragLen(against.removed), fragLen(against.inserted), side);
    if (at === null) return null;
    return at === op.at ? op : { ...op, at };
  }

  // block op vs inline op: block indices are unaffected, but if the inline op
  // edited a block this splice removes, refresh the stored copy so the block
  // op's inverse still restores the latest content.
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

/**
 * Transform one op against a list of already-applied remote ops, in order.
 * Returns null as soon as any step conflicts. This is the building block the
 * future sync layer folds over its pending-op queue.
 */
export function rebaseOp(op: EditorOp, against: EditorOp[], side: 'left' | 'right' = 'left'): EditorOp | null {
  let current: EditorOp | null = op;
  for (const a of against) {
    if (!current) return null;
    current = transformOp(current, a, side);
  }
  return current;
}
