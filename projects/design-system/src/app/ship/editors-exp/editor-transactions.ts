import { ASTBlockNode, ASTDocument, LogicalSelection } from './editor.types';

/**
 * Invertible transactions.
 *
 * Instead of snapshotting the whole document per edit (memento history), every
 * commit is described as a minimal **block splice**: "at index `at`, `removed`
 * blocks were replaced by `inserted` blocks". A splice is trivially invertible
 * (swap removed/inserted), so undo/redo apply operations rather than restore
 * copies — history memory scales with what changed, not with document size.
 *
 * Everything here is plain JSON (blocks are POJOs, no functions/DOM refs), so a
 * transaction can be shipped over a wire verbatim. That is the foundation for
 * realtime collaboration later: a peer applies `splice`, rebases concurrent
 * splices by index shifting, or feeds them to an OT/CRDT layer. Block-level
 * granularity is deliberately coarse for a first step — two peers editing the
 * same block still conflict — but the commit pipeline, inversion, and versioning
 * are the parts that must exist either way.
 */

/** Replace `removed.length` blocks at `at` with `inserted`. */
export interface BlockSplice {
  at: number;
  removed: ASTBlockNode[];
  inserted: ASTBlockNode[];
}

/** One committed edit: the splice plus caret context for undo/redo restore. */
export interface EditorTransaction {
  /** Document version this splice applies on top of (monotonic, per engine). */
  baseVersion: number;
  splice: BlockSplice;
  selBefore: LogicalSelection | null;
  selAfter: LogicalSelection | null;
}

/** Structural block equality — reference check first (transforms share untouched
 * block objects), JSON comparison as the safety net when they don't. */
function blocksEqual(a: ASTBlockNode, b: ASTBlockNode): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Diff two documents into the minimal single splice, or null when identical.
 * Common prefix and suffix are peeled off; whatever remains in the middle is
 * the replacement window. Every editor transform today touches one contiguous
 * region (insert/split/merge/retype), so a single splice is always sufficient.
 */
export function diffDocuments(oldDoc: ASTDocument, newDoc: ASTDocument): BlockSplice | null {
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

  // Clone the stored blocks so later in-place mutations of the live doc can
  // never corrupt history.
  return {
    at: start,
    removed: structuredClone(oldDoc.slice(start, endOld)),
    inserted: structuredClone(newDoc.slice(start, endNew)),
  };
}

/** The exact inverse operation: applying it after the original is a no-op. */
export function invertSplice(splice: BlockSplice): BlockSplice {
  return { at: splice.at, removed: splice.inserted, inserted: splice.removed };
}

/** Apply a splice, returning a new document (blocks cloned in — history stays isolated). */
export function applySplice(doc: ASTDocument, splice: BlockSplice): ASTDocument {
  return [...doc.slice(0, splice.at), ...structuredClone(splice.inserted), ...doc.slice(splice.at + splice.removed.length)];
}
