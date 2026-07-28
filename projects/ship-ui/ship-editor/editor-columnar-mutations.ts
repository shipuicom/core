import { deleteForward, deleteRange, executeInsertText, handleBackspace, handleEnter, handleEscapeHatch, insertFragment, resolveInlinePosition, setBlockType, toggleMark } from './editor-ast.utils';
import { BaseBlockBehavior, BaseInlineBehavior } from './editor-behaviors';
import { ColumnarDocument, RowKind } from './editor-columnar';
import { rowsForBlocks } from './editor-columnar-ops';
import { logicalToPos } from './editor-flat-positions';
import { EditorOp, diffDocuments } from './editor-transactions';
import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark, LogicalPosition, LogicalSelection, TransactionResult, TreeSelection } from './editor.types';

/**
 * Mutation primitives over the columnar document.
 *
 * Each primitive takes the live `ColumnarDocument` and a flat selection,
 * mutates the columnar document in place, and returns the `EditorOp` that
 * describes the change plus the flat selection afterwards. The engine applies
 * that op to the nested tree (which still exists for rendering) and to the
 * undo/collaboration machinery — so the tree is now *derived from* the
 * columnar document rather than the other way around.
 *
 * The op is computed by diffing the affected span of top-level blocks before
 * and after the mutation, using the same `diffDocuments` that used to diff the
 * whole document — bounded to the couple of blocks a primitive touches, so its
 * cost no longer scales with the document.
 *
 * Two tiers of implementation coexist here deliberately:
 * - the typing path (insert text, delete a character, delete a range between
 *   text rows) mutates rows directly;
 * - structural branches with intricate physics (backspace-at-start,
 *   Enter strategies, pasting, block-type changes, mark toggling) delegate to
 *   the existing tree primitives over a *materialized span* via `viaTree`,
 *   which keeps their behaviour bit-for-bit while the branches are ported.
 */

export interface ColumnarMutation {
  op: EditorOp;
  /** Flat selection after the mutation, in the new document's position space. */
  selAfter: LogicalSelection;
}

// ---------------------------------------------------------------------------
// Addressing
// ---------------------------------------------------------------------------

export interface RowPoint {
  row: number;
  /** Character offset within the row's text; 0 for void rows. */
  offset: number;
}

/**
 * The tree-space position where a text row's first character sits.
 *
 * `startOf` counts an enclosing container's *closing* token before the rows
 * inside it (a row's size must be contiguous for the Fenwick), but in the
 * position space that token comes after the children — so a row nested
 * `depth` containers deep is skewed by exactly `depth`.
 */
function interiorStart(cd: ColumnarDocument, row: number): number {
  return cd.startOf(row) + 1 - cd.depthOf(row);
}

/** The row and character offset a flat position addresses, per posToLogical. */
export function pointAt(cd: ColumnarDocument, pos: number): RowPoint {
  const clamped = Math.max(0, Math.min(pos, cd.size));
  let row = cd.posToRow(clamped);
  if (cd.kindOf(row) === RowKind.Container) {
    // A container's own tokens have no interior; descend to its first child.
    row = Math.min(row + 1, cd.rows - 1);
  }
  if (cd.kindOf(row) === RowKind.Void) return { row, offset: 0 };

  let offset = clamped - interiorStart(cd, row);
  // The depth skew can push a boundary position past the row's end; when the
  // position genuinely reaches the next holder's interior, it belongs there.
  while (cd.kindOf(row) === RowKind.Text && offset > cd.textOf(row).length) {
    let next = row + 1;
    if (next < cd.rows && cd.kindOf(next) === RowKind.Container) next++;
    if (next >= cd.rows) break;
    if (cd.kindOf(next) === RowKind.Void) {
      if (clamped >= cd.startOf(next) - cd.depthOf(next)) return { row: next, offset: 0 };
      break;
    }
    const nextOffset = clamped - interiorStart(cd, next);
    if (nextOffset < 0) break;
    row = next;
    offset = nextOffset;
  }
  return { row, offset: Math.max(0, Math.min(offset, cd.textOf(row).length)) };
}

/** The flat position of a character offset within a text row. */
export function flatPosAt(cd: ColumnarDocument, row: number, offset: number): number {
  return interiorStart(cd, row) + offset;
}

export function rootRowOf(cd: ColumnarDocument, row: number): number {
  let r = row;
  while (cd.parentOf(r) !== -1) r = cd.parentOf(r);
  return r;
}

function rootOf(cd: ColumnarDocument, row: number): number {
  return rootRowOf(cd, row);
}

/**
 * DOM-boundary addressing: the DOM is block → item → character, so the
 * boundary converts through that shape once on the way in and once on the way
 * out. `charOffset` clamps to the holder's length; `itemIndex` past the last
 * item resolves to the last item.
 */
export interface BlockPoint {
  blockIndex: number;
  itemIndex?: number;
  charOffset: number;
}

/** Flat position of a character in a top-level block (or one of its items). */
export function flatPosOfBlockChar(cd: ColumnarDocument, point: BlockPoint): number {
  const root = cd.rowOfTopLevel(point.blockIndex);
  if (root >= cd.rows) return cd.size;
  if (cd.kindOf(root) === RowKind.Void) return cd.startOf(root);

  let row = root;
  if (cd.kindOf(root) === RowKind.Container) {
    const end = root + spanOfRoot(cd, root);
    let seen = -1;
    row = root + 1;
    for (let r = root + 1; r < end; r++) {
      if (cd.parentOf(r) !== root) continue;
      row = r;
      seen++;
      if (seen === (point.itemIndex ?? 0)) break;
    }
  }
  if (cd.kindOf(row) === RowKind.Void) return cd.startOf(row);
  return flatPosAt(cd, row, Math.max(0, Math.min(point.charOffset, cd.textOf(row).length)));
}

/** Inverse: the block/item/character a flat position addresses. */
export function blockPointAt(cd: ColumnarDocument, pos: number): BlockPoint {
  const p = pointAt(cd, pos);
  const root = rootRowOf(cd, p.row);
  const blockIndex = topIndexOf(cd, root);
  if (p.row === root) return { blockIndex, charOffset: p.offset };
  let itemIndex = 0;
  for (let r = root + 1; r < p.row; r++) if (cd.parentOf(r) === root) itemIndex++;
  return { blockIndex, itemIndex, charOffset: p.offset };
}

function topIndexOf(cd: ColumnarDocument, rootRow: number): number {
  let n = 0;
  for (let r = 0; r < rootRow; r++) if (cd.parentOf(r) === -1) n++;
  return n;
}

/** Rows occupied by the root at `rootRow`, including all descendants. */
function spanOfRoot(cd: ColumnarDocument, rootRow: number): number {
  let end = rootRow + 1;
  while (end < cd.rows && cd.parentOf(end) !== -1) end++;
  return end - rootRow;
}

function countTops(cd: ColumnarDocument): number {
  let n = 0;
  for (let r = 0; r < cd.rows; r++) if (cd.parentOf(r) === -1) n++;
  return n;
}

// ---------------------------------------------------------------------------
// Materialization — AST fragments read out of the columnar document
// ---------------------------------------------------------------------------

interface Run {
  start: number;
  end: number;
  mark: ASTMark;
}

function cloneMark(mark: ASTMark): ASTMark {
  return mark.attrs ? { type: mark.type, attrs: { ...mark.attrs } } : { type: mark.type };
}

function markKey(mark: ASTMark): string {
  return mark.attrs ? `${mark.type} ${JSON.stringify(mark.attrs)}` : mark.type;
}

function runsOfRow(cd: ColumnarDocument, row: number): Run[] {
  const [from, to] = cd.runRangeOf(row);
  const quads = cd.markRuns;
  const out: Run[] = [];
  for (let q = from; q < to; q++) {
    out.push({ start: quads[q * 4 + 1], end: quads[q * 4 + 2], mark: cd.markDefs[quads[q * 4 + 3]] });
  }
  return out;
}

/** A row's text materialized as inline nodes, optionally clipped to `[from, to)`. */
export function inlineNodesOf(cd: ColumnarDocument, row: number, from = 0, to = Infinity): ASTInlineNode[] {
  const text = cd.textOf(row);
  const lo = Math.max(0, from);
  const hi = Math.min(to, text.length);
  const slice = text.slice(lo, hi);
  const runs = runsOfRow(cd, row).filter((r) => r.start < hi && r.end > lo);
  if (!runs.length) return [{ type: 'text', text: slice }];

  const cuts = new Set<number>([0, slice.length]);
  for (const r of runs) {
    cuts.add(Math.max(0, r.start - lo));
    cuts.add(Math.min(slice.length, r.end - lo));
  }
  const points = [...cuts].sort((a, b) => a - b);

  const out: ASTInlineNode[] = [];
  let previousKey: string | null = null;
  for (let i = 0; i < points.length - 1; i++) {
    const s = points[i];
    const e = points[i + 1];
    if (s === e) continue;
    const covering = runs.filter((r) => r.start - lo <= s && r.end - lo >= e);
    // Dedupe: overlapping runs may carry the same mark twice.
    const seen = new Set<string>();
    const marks: ASTMark[] = [];
    for (const r of covering) {
      const key = markKey(r.mark);
      if (seen.has(key)) continue;
      seen.add(key);
      marks.push(cloneMark(r.mark));
    }
    const key = marks.map(markKey).join(',');
    if (previousKey === key && out.length) {
      out[out.length - 1].text += slice.slice(s, e);
      continue;
    }
    const node: ASTInlineNode = { type: 'text', text: slice.slice(s, e) };
    if (marks.length) node.marks = marks;
    out.push(node);
    previousKey = key;
  }
  return out.length ? out : [{ type: 'text', text: '' }];
}

/** The block rooted at `row`, materialized with its descendants. */
export function blockFromRow(cd: ColumnarDocument, row: number): ASTBlockNode {
  const kind = cd.kindOf(row);
  const block: ASTBlockNode = { type: cd.typeOf(row), content: [] };
  const attrs = cd.attrsOf(row);
  if (attrs) block.attrs = structuredClone(attrs);
  if (kind === RowKind.Text) {
    block.content = inlineNodesOf(cd, row);
  } else if (kind === RowKind.Container) {
    const children: ASTBlockNode[] = [];
    const end = row + spanOfRoot(cd, row);
    for (let r = row + 1; r < end; r++) {
      if (cd.parentOf(r) === row) children.push(blockFromRow(cd, r));
    }
    block.content = children;
  }
  return block;
}

/** `count` top-level blocks starting at `topIndex`, materialized. */
export function topLevelBlocks(cd: ColumnarDocument, topIndex: number, count: number): ASTBlockNode[] {
  const out: ASTBlockNode[] = [];
  let row = cd.rowOfTopLevel(topIndex);
  for (let i = 0; i < count && row < cd.rows; i++) {
    out.push(blockFromRow(cd, row));
    row += spanOfRoot(cd, row);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Row-level mutation helpers
// ---------------------------------------------------------------------------

/**
 * Replace `[at, at + removeLen)` of a text row with `text`, whose own mark
 * coverage is `textRuns` (relative to `text`).
 *
 * Mark boundaries are recomputed deterministically: surviving runs are clipped
 * around the deletion, split (not stretched) at the insertion point, and the
 * inserted text carries exactly `textRuns` — merged with same-mark neighbours.
 * Rows without any marks skip all of that.
 */
function spliceRowText(cd: ColumnarDocument, row: number, at: number, removeLen: number, text: string, textRuns: Run[]): void {
  const oldRuns = runsOfRow(cd, row);
  if (removeLen > 0) cd.deleteText(row, at, removeLen);
  if (text) cd.insertText(row, at, text);
  if (!oldRuns.length && !textRuns.length) return;

  const len = text.length;
  const next: Run[] = [];
  for (const run of oldRuns) {
    // Clip around the deletion…
    const start = run.start <= at ? run.start : Math.max(at, run.start - removeLen);
    const end = run.end <= at ? run.end : Math.max(at, run.end - removeLen);
    if (end <= start) continue;
    // …then split at the insertion point rather than stretching across it.
    if (start < at) next.push({ start, end: Math.min(end, at), mark: run.mark });
    if (end > at) next.push({ start: Math.max(start, at) + len, end: end + len, mark: run.mark });
  }
  for (const run of textRuns) {
    next.push({ start: run.start + at, end: run.end + at, mark: run.mark });
  }
  // setMarks merges same-mark overlaps, so layering these is safe.
  cd.setMarks(row, next);
}

/** Replace `removeCount` top-level blocks starting at `firstTop` with `blocks`. */
function replaceRoots(cd: ColumnarDocument, firstTop: number, removeCount: number, blocks: ASTBlockNode[]): void {
  const startRow = cd.rowOfTopLevel(firstTop);
  let span = 0;
  let row = startRow;
  for (let i = 0; i < removeCount && row < cd.rows; i++) {
    const s = spanOfRoot(cd, row);
    span += s;
    row += s;
  }
  if (span > 0) cd.removeRows(startRow, span);
  if (blocks.length) cd.insertRows(startRow, rowsForBlocks(blocks, startRow));
}

// ---------------------------------------------------------------------------
// Span diffing — the op falls out of before/after over the touched blocks
// ---------------------------------------------------------------------------

function shiftOp(op: EditorOp, baseTop: number): EditorOp {
  if (baseTop === 0) return op;
  if (op.kind === 'block') return { ...op, at: op.at + baseTop };
  return { ...op, blockIndex: op.blockIndex + baseTop };
}

/**
 * Run `mutate` against the columnar document, bracketing the `count` top-level
 * blocks from `baseTop`; the op is the diff of that span before and after.
 * Returns null when the span comes back identical.
 */
function withSpanOp(cd: ColumnarDocument, baseTop: number, count: number, mutate: () => LogicalSelection): ColumnarMutation | null {
  const before = topLevelBlocks(cd, baseTop, count);
  const topsBefore = countTops(cd);
  const selAfter = mutate();
  const newCount = count + (countTops(cd) - topsBefore);
  const after = topLevelBlocks(cd, baseTop, newCount);
  const op = diffDocuments(before, after);
  return op ? { op: shiftOp(op, baseTop), selAfter } : null;
}

// ---------------------------------------------------------------------------
// Tree-primitive delegation over a materialized span
// ---------------------------------------------------------------------------

/** Tree position of a row point, relative to a span starting at `baseTop`. */
function lpInSpan(cd: ColumnarDocument, span: ASTBlockNode[], baseTop: number, point: RowPoint): LogicalPosition {
  const root = rootOf(cd, point.row);
  const blockIndex = topIndexOf(cd, root) - baseTop;
  const block = span[blockIndex];
  if (!block) return { blockIndex: Math.max(0, blockIndex), inlineIndex: 0, offset: 0 };

  if (point.row === root) {
    if (cd.kindOf(root) !== RowKind.Text) return { blockIndex, inlineIndex: 0, offset: 0 };
    return { blockIndex, ...resolveInlinePosition(block.content as ASTInlineNode[], point.offset) };
  }
  let itemIndex = 0;
  for (let r = root + 1; r < point.row; r++) if (cd.parentOf(r) === root) itemIndex++;
  const item = (block.content as ASTBlockNode[])[itemIndex];
  const content = (item?.content ?? []) as ASTInlineNode[];
  return { blockIndex, itemIndex, ...resolveInlinePosition(content, point.offset) };
}

/**
 * Delegate to a tree primitive over a materialized span of top-level blocks.
 *
 * The span is read out of the columnar document, the existing primitive runs
 * on it (optionally preceded by range truncation, mirroring the engine's old
 * dispatch), the result is written back as rows, and the op is the span diff.
 * Exact behavioural parity while a branch awaits a native columnar port.
 */
function viaTree(
  cd: ColumnarDocument,
  sel: LogicalSelection,
  baseTop: number,
  count: number,
  blocks: Map<string, BaseBlockBehavior>,
  truncate: boolean,
  mutation: (doc: ASTDocument, sel: TreeSelection) => TransactionResult | void | null
): ColumnarMutation | null {
  const before = topLevelBlocks(cd, baseTop, count);
  const a = pointAt(cd, sel.from);
  const isCollapsed = sel.from === sel.to;
  const start = lpInSpan(cd, before, baseTop, a);
  const end = isCollapsed ? start : lpInSpan(cd, before, baseTop, pointAt(cd, sel.to));
  const treeSel: TreeSelection = { start, end, isCollapsed };

  let doc: ASTDocument = before;
  let s = treeSel;
  if (truncate && !isCollapsed) {
    const truncation = deleteRange(doc, s, blocks);
    doc = truncation.doc;
    if (truncation.selectionShift) s = truncation.selectionShift;
  }

  const result = mutation(doc, s);
  if (!result && !(truncate && !isCollapsed)) return null;
  const finalDoc = result ? result.doc : doc;
  const shift = result ? (result.selectionShift ?? s) : s;

  const op = diffDocuments(before, finalDoc);
  if (!op) return null;

  replaceRoots(cd, baseTop, count, finalDoc);

  // The shift is relative to the span; its flat position is the span's start
  // plus the offset within the materialized result.
  const spanStart = cd.startOf(cd.rowOfTopLevel(baseTop));
  const from = spanStart + logicalToPos(finalDoc, shift.start);
  const to = shift.isCollapsed ? from : spanStart + logicalToPos(finalDoc, shift.end);
  return { op: shiftOp(op, baseTop), selAfter: { from, to } };
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Marks newly typed text should carry at a caret, mirroring run inheritance. */
function insertionMarks(cd: ColumnarDocument, row: number, offset: number, inlines: Map<string, BaseInlineBehavior>): ASTMark[] {
  const len = cd.textOf(row).length;
  if (len === 0) return [];

  const setKey = (marks: ASTMark[]) => marks.map(markKey).sort().join(',');
  const dedupe = (marks: ASTMark[]) => {
    const seen = new Set<string>();
    return marks.filter((m) => {
      const key = markKey(m);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // The boundary between two runs belongs to the earlier one, so the caret's
  // marks are those covering the character before it (or the first character
  // at the very start of the row).
  const marks = dedupe(cd.marksAt(row, offset > 0 ? offset - 1 : 0));
  if (!marks.length) return marks;

  // At the end of a run — end of the row, or where the mark set changes —
  // non-sticky marks (links) do not extend over new text.
  const atRunEnd = offset === len || (offset > 0 && setKey(dedupe(cd.marksAt(row, offset))) !== setKey(marks));
  if (!atRunEnd) return marks;
  return marks.filter((m) => inlines.get(m.type)?.isSticky !== false);
}

/**
 * Delete `[a, b)` where both points are text rows, mutating rows in place.
 * Returns false when an endpoint needs the tree fallback (void endpoints).
 */
function deleteRangeRows(cd: ColumnarDocument, a: RowPoint, b: RowPoint): boolean {
  if (cd.kindOf(a.row) !== RowKind.Text || cd.kindOf(b.row) !== RowKind.Text) return false;

  if (a.row === b.row) {
    if (b.offset > a.offset) spliceRowText(cd, a.row, a.offset, b.offset - a.offset, '', []);
    return true;
  }

  // Capture the tail of the end row before any rows move.
  const bText = cd.textOf(b.row);
  const tailText = bText.slice(b.offset);
  const tailRuns: Run[] = runsOfRow(cd, b.row)
    .filter((r) => r.end > b.offset)
    .map((r) => ({ start: Math.max(0, r.start - b.offset), end: r.end - b.offset, mark: cloneMark(r.mark) }));

  const rootA = rootOf(cd, a.row);
  const rootB = rootOf(cd, b.row);

  // Truncate the start row.
  spliceRowText(cd, a.row, a.offset, cd.textOf(a.row).length - a.offset, '', []);

  if (rootA === rootB) {
    // Between two items of the same container: drop the rows in between and
    // the end row, then append its tail.
    cd.removeRows(a.row + 1, b.row - a.row);
  } else {
    // Does the end container keep any items past the end row?
    const endSpanEnd = rootB + spanOfRoot(cd, rootB);
    const survivors = rootB !== b.row && b.row + 1 < endSpanEnd;
    if (survivors) {
      // Keep the end container's row; drop its consumed items, everything
      // between the roots, and the start root's trailing rows.
      cd.removeRows(rootB + 1, b.row - rootB);
      cd.removeRows(a.row + 1, rootB - a.row - 1);
    } else {
      cd.removeRows(a.row + 1, b.row - a.row);
    }
  }

  if (tailText) spliceRowText(cd, a.row, a.offset, 0, tailText, tailRuns);
  return true;
}

/**
 * Insert text at the selection, replacing the selection first when it is a
 * range. `pendingMarks` (staged mark toggles at the caret) override inherited
 * marks entirely.
 */
export function insertTextOp(
  cd: ColumnarDocument,
  sel: LogicalSelection,
  text: string,
  blocks: Map<string, BaseBlockBehavior>,
  inlines: Map<string, BaseInlineBehavior>,
  pendingMarks: ASTMark[] | null
): ColumnarMutation | null {
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const isCollapsed = sel.from === sel.to;
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));

  if (cd.kindOf(a.row) !== RowKind.Text || cd.kindOf(b.row) !== RowKind.Text) {
    // Void endpoints — rare; keep the tree primitives' exact behaviour.
    return viaTree(cd, sel, baseTop, lastTop - baseTop + 1, blocks, true, (doc, s) => executeInsertText(doc, s, text, inlines, blocks));
  }

  return withSpanOp(cd, baseTop, lastTop - baseTop + 1, () => {
    if (!isCollapsed) deleteRangeRows(cd, a, b);
    const p = pointAt(cd, sel.from);
    const marks = pendingMarks ?? insertionMarks(cd, p.row, p.offset, inlines);
    const textRuns: Run[] = marks.map((mark) => ({ start: 0, end: text.length, mark }));
    spliceRowText(cd, p.row, p.offset, 0, text, textRuns);
    const caret = sel.from + text.length;
    return { from: caret, to: caret };
  });
}

/** Delete the selected range. */
export function deleteRangeOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | null {
  if (sel.from === sel.to) return null;
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));

  if (cd.kindOf(a.row) !== RowKind.Text || cd.kindOf(b.row) !== RowKind.Text) {
    return viaTree(cd, sel, baseTop, lastTop - baseTop + 1, blocks, false, (doc, s) => deleteRange(doc, s, blocks));
  }

  return withSpanOp(cd, baseTop, lastTop - baseTop + 1, () => {
    deleteRangeRows(cd, a, b);
    return { from: sel.from, to: sel.from };
  });
}

/** Backspace: a character behind the caret, or block physics at a boundary. */
export function backspaceOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | null {
  if (sel.from !== sel.to) return deleteRangeOp(cd, sel, blocks);

  const p = pointAt(cd, sel.from);
  const top = topIndexOf(cd, rootOf(cd, p.row));

  if (cd.kindOf(p.row) === RowKind.Text && p.offset > 0) {
    return withSpanOp(cd, top, 1, () => {
      spliceRowText(cd, p.row, p.offset - 1, 1, '', []);
      return { from: sel.from - 1, to: sel.from - 1 };
    });
  }

  // At the start of a holder: merge/outdent/void physics — tree logic over a
  // span that includes the previous block, which a merge reaches into.
  const baseTop = Math.max(0, top - 1);
  return viaTree(cd, sel, baseTop, top - baseTop + 1, blocks, false, (doc, s) => handleBackspace(doc, s, blocks));
}

/** Forward delete: a character ahead of the caret, or a merge with the next block. */
export function deleteForwardOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | null {
  if (sel.from !== sel.to) return deleteRangeOp(cd, sel, blocks);

  const p = pointAt(cd, sel.from);
  const top = topIndexOf(cd, rootOf(cd, p.row));

  if (cd.kindOf(p.row) === RowKind.Text && p.offset < cd.textOf(p.row).length) {
    return withSpanOp(cd, top, 1, () => {
      spliceRowText(cd, p.row, p.offset, 1, '', []);
      return { from: sel.from, to: sel.from };
    });
  }

  // At the end of a holder: merging with the next item or block.
  const count = Math.min(2, countTops(cd) - top);
  return viaTree(cd, sel, top, count, blocks, false, (doc, s) => deleteForward(doc, s, blocks));
}

/** Enter, with the block behaviors' enter physics. Replaces a range first. */
export function enterOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | null {
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));
  return viaTree(cd, sel, baseTop, lastTop - baseTop + 1, blocks, true, (doc, s) => handleEnter(doc, s, blocks));
}

/** ArrowUp/Left at a block start: hop above the block or inject a paragraph. */
export function escapeHatchOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | { op: null; selAfter: LogicalSelection } | null {
  if (sel.from !== sel.to) return null;
  const p = pointAt(cd, sel.from);
  const top = topIndexOf(cd, rootOf(cd, p.row));
  const baseTop = Math.max(0, top - 1);
  const count = top - baseTop + 1;

  // The tree primitive may move the caret without changing the document, so
  // the span diff can be empty while the call still "handled" the key.
  const before = topLevelBlocks(cd, baseTop, count);
  const treeSel: TreeSelection = (() => {
    const start = lpInSpan(cd, before, baseTop, p);
    return { start, end: start, isCollapsed: true };
  })();
  const result = handleEscapeHatch(before, treeSel, blocks);
  if (!result) return null;

  const op = diffDocuments(before, result.doc);
  if (op) replaceRoots(cd, baseTop, count, result.doc);
  const spanStart = cd.startOf(cd.rowOfTopLevel(baseTop));
  const shift = result.selectionShift ?? treeSel;
  const from = spanStart + logicalToPos(result.doc, shift.start);
  return { op: op ? shiftOp(op, baseTop) : null, selAfter: { from, to: from } };
}

/** Paste a fragment at the selection, replacing it first when it is a range. */
export function insertFragmentOp(
  cd: ColumnarDocument,
  sel: LogicalSelection,
  fragment: ASTDocument,
  blocks: Map<string, BaseBlockBehavior>
): ColumnarMutation | null {
  if (!fragment.length) return null;
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));
  return viaTree(cd, sel, baseTop, lastTop - baseTop + 1, blocks, true, (doc, s) => insertFragment(doc, s, fragment, blocks));
}

/** Change the selected blocks' type, with the tree primitive's full physics. */
export function setBlockTypeOp(
  cd: ColumnarDocument,
  sel: LogicalSelection,
  type: string,
  blocks: Map<string, BaseBlockBehavior>,
  attrs?: Record<string, any>
): ColumnarMutation | null {
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));
  return viaTree(cd, sel, baseTop, lastTop - baseTop + 1, blocks, false, (doc, s) => setBlockType(doc, s, type, blocks, attrs));
}

/** Toggle (or force) a mark over the selected range. */
export function toggleMarkOp(
  cd: ColumnarDocument,
  sel: LogicalSelection,
  markType: string,
  attrs: Record<string, any> | undefined,
  blocks: Map<string, BaseBlockBehavior>,
  force?: 'add' | 'remove'
): ColumnarMutation | null {
  if (sel.from === sel.to) return null;
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));
  return viaTree(cd, sel, baseTop, lastTop - baseTop + 1, blocks, false, (doc, s) => toggleMark(doc, s, markType, attrs, blocks, force));
}
