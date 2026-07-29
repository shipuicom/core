import { BaseBlockBehavior, BaseInlineBehavior } from './editor-behaviors';
import { ColumnarDocument, ColumnarRowInput, RowKind } from './editor-columnar';
import { rowsForBlocks } from './editor-columnar-ops';
import { StepMap, docSize, sharedPrefix, sharedSuffix } from './editor-flat-positions';
import { EditorOp, diffDocuments, fragLen, spliceInlineContent } from './editor-transactions';
import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark, LogicalSelection } from './editor.types';

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
 * Every primitive is implemented as row operations: text edits splice one
 * row's string and recompute its mark runs; structural physics (splits,
 * merges, outdents, wraps) remove and insert rows. AST fragments appear only
 * where the op format itself needs them.
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

/** Number of top-level blocks. */
export function topLevelCount(cd: ColumnarDocument): number {
  return countTops(cd);
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

/** A row's mark runs clipped to `[from, to)` and rebased to start at 0. */
function clipRuns(cd: ColumnarDocument, row: number, from: number, to: number): Run[] {
  const hi = Math.min(to, cd.textOf(row).length);
  return runsOfRow(cd, row)
    .filter((r) => r.start < hi && r.end > from)
    .map((r) => ({ start: Math.max(0, r.start - from), end: Math.min(hi, r.end) - from, mark: cloneMark(r.mark) }));
}

/** Direct child rows of a container row, in order. */
function childrenOf(cd: ColumnarDocument, root: number): number[] {
  const out: number[] = [];
  const end = root + spanOfRoot(cd, root);
  for (let r = root + 1; r < end; r++) if (cd.parentOf(r) === root) out.push(r);
  return out;
}

/** Ordinal of a child row among its container's children. */
function childOrdinal(cd: ColumnarDocument, root: number, row: number): number {
  let n = 0;
  for (let r = root + 1; r < row; r++) if (cd.parentOf(r) === root) n++;
  return n;
}

function emptyParagraph(): ASTBlockNode {
  return { type: 'paragraph', content: [{ type: 'text', text: '' }] };
}

function caretSel(pos: number): LogicalSelection {
  return { from: pos, to: pos };
}

/** A captured text row: enough to re-insert it elsewhere. */
interface CapturedRow {
  type: string;
  text: string;
  runs: Run[];
  attrs?: Record<string, unknown>;
}

function captureRow(cd: ColumnarDocument, row: number): CapturedRow {
  const attrs = cd.attrsOf(row);
  return {
    type: cd.typeOf(row),
    text: cd.textOf(row),
    runs: clipRuns(cd, row, 0, Infinity),
    ...(attrs ? { attrs: structuredClone(attrs) } : {}),
  };
}

/** Inline nodes flattened to one string plus mark ranges over it. */
function inlineToTextRuns(nodes: ASTInlineNode[]): { text: string; runs: Run[] } {
  let text = '';
  const runs: Run[] = [];
  for (const node of nodes) {
    const start = text.length;
    text += node.text ?? '';
    for (const mark of node.marks ?? []) runs.push({ start, end: text.length, mark });
  }
  return { text, runs };
}

function shiftRuns(runs: Run[], by: number): Run[] {
  return runs.map((r) => ({ start: r.start + by, end: r.end + by, mark: r.mark }));
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
 * Delete `[a, b)`, mutating rows in place.
 *
 * Text endpoints merge: the start holder keeps its head and receives the end
 * holder's tail. A void start point means the void itself is inside the range
 * and is consumed — the end holder keeps its tail in place. A void end point
 * consumes the void (matching the tree primitive, which spliced the end block
 * out).
 */
function deleteRangeRows(cd: ColumnarDocument, a: RowPoint, b: RowPoint): void {
  if (a.row === b.row) {
    if (cd.kindOf(a.row) === RowKind.Text && b.offset > a.offset) {
      spliceRowText(cd, a.row, a.offset, b.offset - a.offset, '', []);
    }
    return;
  }

  const aIsText = cd.kindOf(a.row) === RowKind.Text;
  const bIsText = cd.kindOf(b.row) === RowKind.Text;
  const rootA = rootOf(cd, a.row);
  const rootB = rootOf(cd, b.row);

  // Capture the tail of the end row before any rows move.
  const tailText = bIsText ? cd.textOf(b.row).slice(b.offset) : '';
  const tailRuns = bIsText ? clipRuns(cd, b.row, b.offset, Infinity) : [];

  if (aIsText) {
    // Truncate the start row, then drop everything through the end point.
    spliceRowText(cd, a.row, a.offset, cd.textOf(a.row).length - a.offset, '', []);

    if (rootA === rootB) {
      cd.removeRows(a.row + 1, b.row - a.row);
    } else {
      const endSpanEnd = rootB + spanOfRoot(cd, rootB);
      const survivors = bIsText && rootB !== b.row && b.row + 1 < endSpanEnd;
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
    return;
  }

  // The start point sits on a void: the void is consumed with the range, and
  // the end holder keeps its own tail rather than merging anywhere.
  if (bIsText) {
    cd.deleteText(b.row, 0, b.offset);
    if (rootB !== b.row && b.row > rootB + 1) cd.removeRows(rootB + 1, b.row - rootB - 1);
    cd.removeRows(a.row, rootB - a.row);
  } else {
    cd.removeRows(a.row, b.row - a.row + 1);
  }
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
): ColumnarMutation | { op: null; selAfter: LogicalSelection } | null {
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const isCollapsed = sel.from === sel.to;

  // Text cannot land on a void row.
  if (isCollapsed && cd.kindOf(a.row) !== RowKind.Text) return null;

  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));

  let selAfter: LogicalSelection | null = null;
  const mutation = withSpanOp(cd, baseTop, lastTop - baseTop + 1, () => {
    if (!isCollapsed) deleteRangeRows(cd, a, b);
    const p = pointAt(cd, sel.from);
    if (cd.kindOf(p.row) !== RowKind.Text) return (selAfter = caretSel(sel.from));
    const marks = pendingMarks ?? insertionMarks(cd, p.row, p.offset, inlines);
    const textRuns: Run[] = marks.map((mark) => ({ start: 0, end: text.length, mark }));
    spliceRowText(cd, p.row, p.offset, 0, text, textRuns);
    return (selAfter = caretSel(sel.from + text.length));
  });
  if (mutation) return mutation;
  // Typing over a selection that equals the text nets out to no op, but the
  // selection still collapses to the caret after it.
  return !isCollapsed && selAfter ? { op: null, selAfter } : null;
}

/** Delete the selected range. */
export function deleteRangeOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | null {
  if (sel.from === sel.to) return null;
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));

  return withSpanOp(cd, baseTop, lastTop - baseTop + 1, () => {
    deleteRangeRows(cd, a, b);
    return caretSel(sel.from);
  });
}

/** Backspace: a character behind the caret, or block physics at a boundary. */
export function backspaceOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | null {
  if (sel.from !== sel.to) return deleteRangeOp(cd, sel, blocks);

  const p = pointAt(cd, sel.from);
  const root = rootOf(cd, p.row);
  const top = topIndexOf(cd, root);

  if (cd.kindOf(p.row) === RowKind.Text && p.offset > 0) {
    return withSpanOp(cd, top, 1, () => {
      spliceRowText(cd, p.row, p.offset - 1, 1, '', []);
      return caretSel(sel.from - 1);
    });
  }

  // --- at the start of the caret's holder ---

  // A. inside a container: item physics
  if (cd.parentOf(p.row) !== -1) {
    const spanEnd = root + spanOfRoot(cd, root);
    const itemIdx = childOrdinal(cd, root, p.row);
    const onlyItem = spanEnd - root === 2;

    if (cd.textOf(p.row).length === 0) {
      // empty item: drop it; an emptied container becomes a paragraph
      return withSpanOp(cd, top, 1, () => {
        if (onlyItem) {
          replaceRoots(cd, top, 1, [emptyParagraph()]);
          return caretSel(flatPosOfBlockChar(cd, { blockIndex: top, charOffset: 0 }));
        }
        cd.removeRows(p.row, 1);
        if (itemIdx > 0) return caretSel(flatPosAt(cd, p.row - 1, cd.textOf(p.row - 1).length));
        return caretSel(flatPosAt(cd, root + 1, 0));
      });
    }

    if (blocks.get(cd.typeOf(p.row))?.backspacePhysics.fallbackType === 'outdent') {
      const item = captureRow(cd, p.row);
      const isLast = p.row === spanEnd - 1;
      return withSpanOp(cd, top, 1, () => {
        if (onlyItem) {
          replaceRoots(cd, top, 1, [{ type: 'paragraph', content: inlineNodesOf(cd, p.row) }]);
          return caretSel(flatPosOfBlockChar(cd, { blockIndex: top, charOffset: 0 }));
        }
        if (itemIdx === 0) {
          cd.removeRows(p.row, 1);
          cd.insertRows(root, [{ type: 'paragraph', kind: RowKind.Text, text: item.text, marks: item.runs }]);
          return caretSel(flatPosOfBlockChar(cd, { blockIndex: top, charOffset: 0 }));
        }
        if (isLast) {
          cd.removeRows(p.row, 1);
          cd.insertRows(root + spanOfRoot(cd, root), [{ type: 'paragraph', kind: RowKind.Text, text: item.text, marks: item.runs }]);
          return caretSel(flatPosOfBlockChar(cd, { blockIndex: top + 1, charOffset: 0 }));
        }
        // middle: [left items] paragraph [right items in a fresh container]
        const container = captureRow(cd, root);
        const right: CapturedRow[] = [];
        for (let r = p.row + 1; r < spanEnd; r++) right.push(captureRow(cd, r));
        cd.removeRows(p.row, spanEnd - p.row);
        const at = root + spanOfRoot(cd, root);
        cd.insertRows(at, [
          { type: 'paragraph', kind: RowKind.Text, text: item.text, marks: item.runs },
          { type: container.type, kind: RowKind.Container, attrs: container.attrs },
          ...right.map((it) => ({ type: it.type, kind: RowKind.Text, text: it.text, marks: it.runs, attrs: it.attrs, parent: at + 1, depth: 1 })),
        ]);
        return caretSel(flatPosOfBlockChar(cd, { blockIndex: top + 1, charOffset: 0 }));
      });
    }
    // A non-outdenting item at its start falls through to the merge physics
    // below, exactly like the tree code did.
  }

  // B. a void block deletes itself
  if (cd.kindOf(root) === RowKind.Void) {
    if (countTops(cd) === 1) {
      return withSpanOp(cd, top, 1, () => {
        replaceRoots(cd, top, 1, [emptyParagraph()]);
        return caretSel(flatPosOfBlockChar(cd, { blockIndex: top, charOffset: 0 }));
      });
    }
    const baseTop = Math.max(0, top - 1);
    return withSpanOp(cd, baseTop, top - baseTop + 1, () => {
      cd.removeRows(root, 1);
      const target = Math.max(0, top - 1);
      return caretSel(flatPosOfBlockChar(cd, { blockIndex: target, itemIndex: Number.MAX_SAFE_INTEGER, charOffset: Number.MAX_SAFE_INTEGER }));
    });
  }

  // C. fallback type at block start (heading -> paragraph), attrs dropped
  const fallback = blocks.get(cd.typeOf(root))?.backspacePhysics.fallbackType;
  if (cd.kindOf(root) === RowKind.Text && fallback && fallback !== 'outdent' && cd.typeOf(root) !== fallback) {
    const row = captureRow(cd, root);
    return withSpanOp(cd, top, 1, () => {
      cd.removeRows(root, 1);
      cd.insertRows(root, [{ type: fallback, kind: RowKind.Text, text: row.text, marks: row.runs }]);
      return caretSel(sel.from);
    });
  }

  if (top === 0) return null;

  // D. merge into the previous block
  const prevRoot = cd.rowOfTopLevel(top - 1);
  const prevKind = cd.kindOf(prevRoot);

  if (prevKind === RowKind.Void) {
    // Backspacing onto a void removes it; the caret's position shifts by its size.
    return withSpanOp(cd, top - 1, 2, () => {
      cd.removeRows(prevRoot, 1);
      return caretSel(sel.from - 1);
    });
  }

  const currIsContainer = cd.kindOf(root) === RowKind.Container;

  if (prevKind === RowKind.Container) {
    const prevLast = prevRoot + spanOfRoot(cd, prevRoot) - 1;
    const prevLen = cd.textOf(prevLast).length;
    return withSpanOp(cd, top - 1, 2, () => {
      if (currIsContainer) {
        // First item's text joins the previous list's last item; the remaining
        // items become items of the previous list.
        const items = childrenOf(cd, root).map((r) => captureRow(cd, r));
        cd.removeRows(root, spanOfRoot(cd, root));
        const first = items[0];
        if (first?.text) spliceRowText(cd, prevLast, prevLen, 0, first.text, first.runs);
        const rest = items.slice(1);
        if (rest.length) {
          cd.insertRows(prevLast + 1, rest.map((it) => ({ type: it.type, kind: RowKind.Text, text: it.text, marks: it.runs, attrs: it.attrs, parent: prevRoot, depth: 1 })));
        }
      } else {
        const curr = captureRow(cd, root);
        cd.removeRows(root, 1);
        if (curr.text) spliceRowText(cd, prevLast, prevLen, 0, curr.text, curr.runs);
      }
      return caretSel(flatPosAt(cd, prevLast, prevLen));
    });
  }

  // previous block holds text
  const prevLen = cd.textOf(prevRoot).length;
  return withSpanOp(cd, top - 1, 2, () => {
    if (currIsContainer) {
      // First item's text joins the previous block; the rest become paragraphs.
      const items = childrenOf(cd, root).map((r) => captureRow(cd, r));
      cd.removeRows(root, spanOfRoot(cd, root));
      const first = items[0];
      if (first?.text) spliceRowText(cd, prevRoot, prevLen, 0, first.text, first.runs);
      const rest = items.slice(1);
      if (rest.length) {
        cd.insertRows(prevRoot + 1, rest.map((it) => ({ type: 'paragraph', kind: RowKind.Text, text: it.text, marks: it.runs })));
      }
    } else {
      const curr = captureRow(cd, root);
      cd.removeRows(root, 1);
      if (curr.text) spliceRowText(cd, prevRoot, prevLen, 0, curr.text, curr.runs);
    }
    return caretSel(flatPosAt(cd, prevRoot, prevLen));
  });
}

/** Forward delete: a character ahead of the caret, or a merge with the next block. */
export function deleteForwardOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | null {
  if (sel.from !== sel.to) return deleteRangeOp(cd, sel, blocks);

  const p = pointAt(cd, sel.from);
  if (cd.kindOf(p.row) !== RowKind.Text) return null;
  const root = rootOf(cd, p.row);
  const top = topIndexOf(cd, root);

  if (p.offset < cd.textOf(p.row).length) {
    return withSpanOp(cd, top, 1, () => {
      spliceRowText(cd, p.row, p.offset, 1, '', []);
      return caretSel(sel.from);
    });
  }

  // At the end of a holder: merge the next item into this one...
  if (cd.parentOf(p.row) !== -1) {
    const next = p.row + 1;
    if (next < cd.rows && cd.parentOf(next) === cd.parentOf(p.row)) {
      return withSpanOp(cd, top, 1, () => {
        const item = captureRow(cd, next);
        cd.removeRows(next, 1);
        if (item.text) spliceRowText(cd, p.row, p.offset, 0, item.text, item.runs);
        return caretSel(sel.from);
      });
    }
  }

  // ...or merge with the next top-level block.
  if (top >= countTops(cd) - 1) return null;
  const nextRoot = cd.rowOfTopLevel(top + 1);
  const nextKind = cd.kindOf(nextRoot);
  return withSpanOp(cd, top, 2, () => {
    if (nextKind === RowKind.Void) {
      cd.removeRows(nextRoot, 1);
    } else if (nextKind === RowKind.Container) {
      const first = nextRoot + 1;
      const item = captureRow(cd, first);
      const emptied = first + 1 >= nextRoot + spanOfRoot(cd, nextRoot);
      cd.removeRows(first, 1);
      if (emptied) cd.removeRows(nextRoot, 1);
      if (item.text) spliceRowText(cd, p.row, p.offset, 0, item.text, item.runs);
    } else {
      const nextRow = captureRow(cd, nextRoot);
      cd.removeRows(nextRoot, 1);
      if (nextRow.text) spliceRowText(cd, p.row, p.offset, 0, nextRow.text, nextRow.runs);
    }
    return caretSel(sel.from);
  });
}

/** Enter, with the block behaviors' enter physics. Replaces a range first. */
export function enterOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | null {
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));

  return withSpanOp(cd, baseTop, lastTop - baseTop + 1, () => {
    if (sel.from !== sel.to) deleteRangeRows(cd, a, b);
    const p = pointAt(cd, sel.from);
    const root = rootOf(cd, p.row);
    const top = topIndexOf(cd, root);
    const behavior = blocks.get(cd.typeOf(root));
    if (!behavior) return caretSel(sel.from);
    const physics = behavior.enterPhysics;

    if (behavior.category === 'void' || physics.strategy === 'insert-default-below') {
      const type = physics.defaultSplitTarget || 'paragraph';
      const at = root + spanOfRoot(cd, root);
      cd.insertRows(at, [{ type, kind: RowKind.Text, text: '' }]);
      return caretSel(flatPosAt(cd, at, 0));
    }

    if (behavior.category === 'container') {
      const spanEnd = root + spanOfRoot(cd, root);
      const itemIdx = childOrdinal(cd, root, p.row);

      if (cd.textOf(p.row).length === 0) {
        // Enter on an empty item exits the list at that point.
        if (spanEnd - root === 2) {
          replaceRoots(cd, top, 1, [emptyParagraph()]);
          return caretSel(flatPosOfBlockChar(cd, { blockIndex: top, charOffset: 0 }));
        }
        const isLast = p.row === spanEnd - 1;
        cd.removeRows(p.row, 1);
        if (isLast) {
          const at = root + spanOfRoot(cd, root);
          cd.insertRows(at, [{ type: 'paragraph', kind: RowKind.Text, text: '' }]);
          return caretSel(flatPosAt(cd, at, 0));
        }
        if (itemIdx === 0) {
          cd.insertRows(root, [{ type: 'paragraph', kind: RowKind.Text, text: '' }]);
          return caretSel(flatPosAt(cd, root, 0));
        }
        // middle: [left items] empty paragraph [right items in a fresh container]
        const container = captureRow(cd, root);
        const currentEnd = root + spanOfRoot(cd, root);
        const right: CapturedRow[] = [];
        for (let r = p.row; r < currentEnd; r++) right.push(captureRow(cd, r));
        cd.removeRows(p.row, currentEnd - p.row);
        const at = root + spanOfRoot(cd, root);
        cd.insertRows(at, [
          { type: 'paragraph', kind: RowKind.Text, text: '' },
          { type: container.type, kind: RowKind.Container, attrs: container.attrs },
          ...right.map((it) => ({ type: it.type, kind: RowKind.Text, text: it.text, marks: it.runs, attrs: it.attrs, parent: at + 1, depth: 1 })),
        ]);
        return caretSel(flatPosAt(cd, at, 0));
      }

      // Split the item at the caret.
      const tail = cd.textOf(p.row).slice(p.offset);
      const tailRuns = clipRuns(cd, p.row, p.offset, Infinity);
      spliceRowText(cd, p.row, p.offset, cd.textOf(p.row).length - p.offset, '', []);
      cd.insertRows(p.row + 1, [{ type: 'list-item', kind: RowKind.Text, text: tail, marks: tailRuns, parent: root, depth: 1 }]);
      return caretSel(flatPosAt(cd, p.row + 1, 0));
    }

    // Text block.
    const len = cd.textOf(root).length;
    const isAtEnd = p.offset === len;

    if (physics.strategy === 'breakout' && isAtEnd) {
      const type = physics.defaultSplitTarget || 'paragraph';
      cd.insertRows(root + 1, [{ type, kind: RowKind.Text, text: '' }]);
      return caretSel(flatPosAt(cd, root + 1, 0));
    }

    if (physics.strategy === 'newline') {
      const text = cd.textOf(root);
      if (isAtEnd && text.endsWith('\n')) {
        // Double Enter at the end breaks out: drop the trailing newline.
        cd.deleteText(root, len - 1, 1);
        const type = physics.defaultSplitTarget || 'paragraph';
        cd.insertRows(root + 1, [{ type, kind: RowKind.Text, text: '' }]);
        return caretSel(flatPosAt(cd, root + 1, 0));
      }
      const lastLine = text.slice(0, p.offset).split('\n').pop() ?? '';
      const injected = '\n' + (/^[ \t]*/.exec(lastLine)?.[0] ?? '');
      spliceRowText(cd, root, p.offset, 0, injected, []);
      return caretSel(sel.from + injected.length);
    }

    // split-self: the tail becomes a new block of the same type and attrs.
    const tail = cd.textOf(root).slice(p.offset);
    const tailRuns = clipRuns(cd, root, p.offset, Infinity);
    const attrs = cd.attrsOf(root);
    spliceRowText(cd, root, p.offset, len - p.offset, '', []);
    cd.insertRows(root + 1, [{ type: cd.typeOf(root), kind: RowKind.Text, text: tail, marks: tailRuns, attrs: attrs ? structuredClone(attrs) : undefined }]);
    return caretSel(flatPosAt(cd, root + 1, 0));
  });
}

/** ArrowUp/Left at a block start: hop above the block or inject a paragraph. */
export function escapeHatchOp(cd: ColumnarDocument, sel: LogicalSelection, blocks: Map<string, BaseBlockBehavior>): ColumnarMutation | { op: null; selAfter: LogicalSelection } | null {
  if (sel.from !== sel.to) return null;
  const p = pointAt(cd, sel.from);
  const root = rootOf(cd, p.row);
  const kind = cd.kindOf(root);

  // Only fires at the very start of the block — for a container, the start of
  // its first item. (A void row's only position is its start.)
  if (kind === RowKind.Container && (p.row !== root + 1 || p.offset !== 0)) return null;
  if (kind === RowKind.Text && p.offset !== 0) return null;

  const top = topIndexOf(cd, root);
  if (top === 0) {
    // Nothing above: inject an empty paragraph, unless this already is one.
    if (cd.typeOf(root) === 'paragraph' && kind !== RowKind.Container && cd.textOf(root) === '') return null;
    return withSpanOp(cd, 0, 1, () => {
      cd.insertRows(root, [{ type: 'paragraph', kind: RowKind.Text, text: '' }]);
      return caretSel(flatPosAt(cd, root, 0));
    });
  }

  // Move the caret to the end of the previous block; no document change.
  const from = flatPosOfBlockChar(cd, { blockIndex: top - 1, itemIndex: Number.MAX_SAFE_INTEGER, charOffset: Number.MAX_SAFE_INTEGER });
  return { op: null, selAfter: { from, to: from } };
}

/** Paste a fragment at the selection, replacing it first when it is a range. */
export function insertFragmentOp(
  cd: ColumnarDocument,
  sel: LogicalSelection,
  fragment: ASTDocument,
  blocks: Map<string, BaseBlockBehavior>
): ColumnarMutation | { op: null; selAfter: LogicalSelection } | null {
  if (!fragment.length) return null;
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));

  const holdsInline = (block: ASTBlockNode) => {
    const content = block.content as unknown[] | undefined;
    return !content || content.length === 0 || typeof (content[0] as ASTInlineNode)?.text === 'string';
  };
  const nodesOf = (block: ASTBlockNode) =>
    (block.content as ASTInlineNode[])?.length ? (block.content as ASTInlineNode[]) : [{ type: 'text', text: '' } as ASTInlineNode];

  let selAfter: LogicalSelection | null = null;
  const caretTo = (pos: LogicalSelection): LogicalSelection => (selAfter = pos);
  const mutation = withSpanOp(cd, baseTop, lastTop - baseTop + 1, () => {
    if (sel.from !== sel.to) deleteRangeRows(cd, a, b);
    const p = pointAt(cd, sel.from);
    const root = rootOf(cd, p.row);
    const top = topIndexOf(cd, root);
    const fragClone = structuredClone(fragment) as ASTDocument;

    if (cd.kindOf(p.row) !== RowKind.Text) {
      // Caret resolved onto a void: the fragment lands after it, whole.
      const at = root + spanOfRoot(cd, root);
      cd.insertRows(at, rowsForBlocks(fragClone, at));
      const landedTop = top + fragClone.length;
      return caretTo(caretSel(flatPosOfBlockChar(cd, { blockIndex: landedTop, itemIndex: Number.MAX_SAFE_INTEGER, charOffset: Number.MAX_SAFE_INTEGER })));
    }

    // Pasting into a list item: containers in the fragment expand into the
    // inline-holding blocks they contain, which become items.
    if (cd.parentOf(p.row) !== -1) {
      const flatten = (nodes: ASTBlockNode[]): ASTBlockNode[] =>
        nodes.flatMap((n) => (holdsInline(n) ? [n] : flatten(n.content as ASTBlockNode[])));
      let flat = flatten(fragClone);
      if (!flat.length) flat = [emptyParagraph()];

      if (flat.length === 1) {
        const m = inlineToTextRuns(nodesOf(flat[0]));
        spliceRowText(cd, p.row, p.offset, 0, m.text, m.runs);
        return caretTo(caretSel(sel.from + m.text.length));
      }

      const tailText = cd.textOf(p.row).slice(p.offset);
      const tailRuns = clipRuns(cd, p.row, p.offset, Infinity);
      const first = inlineToTextRuns(nodesOf(flat[0]));
      spliceRowText(cd, p.row, p.offset, cd.textOf(p.row).length - p.offset, '', []);
      if (first.text) spliceRowText(cd, p.row, p.offset, 0, first.text, first.runs);

      const inputs: ColumnarRowInput[] = [];
      for (let i = 1; i < flat.length - 1; i++) {
        const m = inlineToTextRuns(nodesOf(flat[i]));
        inputs.push({ type: 'list-item', kind: RowKind.Text, text: m.text, marks: m.runs, parent: root, depth: 1 });
      }
      const last = inlineToTextRuns(nodesOf(flat[flat.length - 1]));
      inputs.push({
        type: 'list-item',
        kind: RowKind.Text,
        text: last.text + tailText,
        marks: [...last.runs, ...shiftRuns(tailRuns, last.text.length)],
        parent: root,
        depth: 1,
      });
      cd.insertRows(p.row + 1, inputs);
      return caretTo(caretSel(flatPosAt(cd, p.row + inputs.length, last.text.length)));
    }

    // Caret in a top-level text block.
    if (fragClone.some((block) => !holdsInline(block))) {
      // Structural fragment (lists, voids): split the block around the caret
      // and drop the fragment in whole.
      const left = inlineNodesOf(cd, root, 0, p.offset);
      const right = inlineNodesOf(cd, root, p.offset, Infinity);
      const type = cd.typeOf(root);
      const attrs = cd.attrsOf(root);
      const headHas = left.some((n) => n.text.length > 0);
      const tailHas = right.some((n) => n.text.length > 0);
      const out: ASTBlockNode[] = [];
      if (headHas) out.push({ type, ...(attrs ? { attrs: structuredClone(attrs) } : {}), content: left });
      out.push(...fragClone);
      if (tailHas) out.push({ type, ...(attrs ? { attrs: structuredClone(attrs) } : {}), content: right });
      if (!out.length) out.push(emptyParagraph());
      replaceRoots(cd, top, 1, out);

      // The caret lands after the END of the last pasted element — for a
      // container that is the end of its last item.
      const landedTop = top + (headHas ? 1 : 0) + fragClone.length - 1;
      const edge = Number.MAX_SAFE_INTEGER;
      return caretTo(caretSel(flatPosOfBlockChar(cd, { blockIndex: landedTop, itemIndex: edge, charOffset: edge })));
    }

    if (fragClone.length === 1) {
      const m = inlineToTextRuns(nodesOf(fragClone[0]));
      spliceRowText(cd, root, p.offset, 0, m.text, m.runs);
      return caretTo(caretSel(sel.from + m.text.length));
    }

    // Multi-block inline fragment: the head keeps this block's type, middles
    // keep their own, and the tail takes the last fragment block's type.
    const len = cd.textOf(root).length;
    const tailText = cd.textOf(root).slice(p.offset);
    const tailRuns = clipRuns(cd, root, p.offset, Infinity);
    const first = inlineToTextRuns(nodesOf(fragClone[0]));
    spliceRowText(cd, root, p.offset, len - p.offset, '', []);
    if (first.text) spliceRowText(cd, root, p.offset, 0, first.text, first.runs);
    const headHas = p.offset + first.text.length > 0;

    const inputs: ColumnarRowInput[] = [];
    for (let i = 1; i < fragClone.length - 1; i++) {
      const block = fragClone[i];
      const m = inlineToTextRuns(nodesOf(block));
      inputs.push({ type: block.type, kind: RowKind.Text, text: m.text, marks: m.runs, attrs: block.attrs });
    }
    const lastBlock = fragClone[fragClone.length - 1];
    const last = inlineToTextRuns(nodesOf(lastBlock));
    const tailFull = last.text + tailText;
    if (tailFull.length > 0) {
      inputs.push({
        type: lastBlock.type,
        kind: RowKind.Text,
        text: tailFull,
        marks: [...last.runs, ...shiftRuns(tailRuns, last.text.length)],
        attrs: lastBlock.attrs,
      });
    }
    cd.insertRows(root + 1, inputs);
    if (!headHas) cd.removeRows(root, 1);

    const finalCount = (headHas ? 1 : 0) + inputs.length;
    if (!finalCount) {
      replaceRoots(cd, top, 1, [emptyParagraph()]);
      return caretTo(caretSel(flatPosOfBlockChar(cd, { blockIndex: top, charOffset: 0 })));
    }
    return caretTo(caretSel(flatPosOfBlockChar(cd, { blockIndex: top + finalCount - 1, charOffset: last.text.length })));
  });
  if (mutation) return mutation;
  // Pasting a copy of the selection over itself nets out to no op; the
  // selection still collapses to a caret after the pasted content.
  return sel.from !== sel.to && selAfter ? { op: null, selAfter } : null;
}

/**
 * Insert an image (with a trailing paragraph) at the selection, replacing the
 * selection first when it is a range. An empty paragraph at the caret is
 * replaced rather than kept above the image.
 */
export function insertImageOp(
  cd: ColumnarDocument,
  sel: LogicalSelection,
  blocks: Map<string, BaseBlockBehavior>,
  attrs: Record<string, unknown>
): (ColumnarMutation & { blockIndex: number }) | null {
  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const baseTop = topIndexOf(cd, rootOf(cd, a.row));
  const lastTop = topIndexOf(cd, rootOf(cd, b.row));

  let blockIndex = 0;
  const mutation = withSpanOp(cd, baseTop, lastTop - baseTop + 1, () => {
    if (sel.from !== sel.to) deleteRangeRows(cd, a, b);
    const p = pointAt(cd, sel.from);
    const root = rootOf(cd, p.row);
    const top = topIndexOf(cd, root);
    const image: ASTBlockNode = { type: 'image', attrs: { ...attrs }, content: [] };

    const emptyPara = cd.typeOf(root) === 'paragraph' && cd.kindOf(root) !== RowKind.Container && cd.textOf(root) === '';
    if (emptyPara) {
      replaceRoots(cd, top, 1, [image, emptyParagraph()]);
      blockIndex = top;
    } else {
      const at = root + spanOfRoot(cd, root);
      cd.insertRows(at, rowsForBlocks([image, emptyParagraph()], at));
      blockIndex = top + 1;
    }
    return caretSel(cd.startOf(cd.rowOfTopLevel(blockIndex)));
  });
  return mutation ? { ...mutation, blockIndex } : null;
}

/**
 * Change the selected blocks' type, mirroring the tree primitive's physics:
 * toggling back to paragraph when everything already matches, wrapping into /
 * unwrapping from containers, flattening into and exploding out of code
 * blocks, and stashing content through void conversions.
 */
export function setBlockTypeOp(
  cd: ColumnarDocument,
  sel: LogicalSelection,
  targetType: string,
  blocks: Map<string, BaseBlockBehavior>,
  attrs?: Record<string, any>
): ColumnarMutation | null {
  const targetBehavior = blocks.get(targetType);
  if (!targetBehavior) return null;

  const a = pointAt(cd, sel.from);
  const b = pointAt(cd, sel.to);
  const startTop = topIndexOf(cd, rootOf(cd, a.row));
  const endTop = topIndexOf(cd, rootOf(cd, b.row));
  const count = endTop - startTop + 1;

  const roots: number[] = [];
  {
    let row = cd.rowOfTopLevel(startTop);
    for (let i = 0; i < count && row < cd.rows; i++) {
      roots.push(row);
      row += spanOfRoot(cd, row);
    }
  }

  const attrsMatch = (row: number) =>
    attrs ? Object.entries(attrs).every(([k, v]) => (cd.attrsOf(row) as any)?.[k] === v) : true;
  const allMatch = roots.every((r) => cd.typeOf(r) === targetType && attrsMatch(r));
  const finalType = allMatch ? 'paragraph' : targetType;
  const finalBehavior = blocks.get(finalType);

  if (finalBehavior?.category === 'container') {
    if (allMatch) {
      // Unwrap: every container in the range explodes into paragraphs.
      const out: ASTBlockNode[] = [];
      for (const r of roots) {
        if (cd.kindOf(r) === RowKind.Container) {
          for (const c of childrenOf(cd, r)) out.push({ type: 'paragraph', content: inlineNodesOf(cd, c) });
        } else out.push(blockFromRow(cd, r));
      }
      return withSpanOp(cd, startTop, count, () => {
        replaceRoots(cd, startTop, count, out);
        return {
          from: flatPosOfBlockChar(cd, { blockIndex: startTop, charOffset: 0 }),
          to: flatPosOfBlockChar(cd, { blockIndex: startTop + out.length - 1, charOffset: 0 }),
        };
      });
    }
    // Wrap the whole range into one container.
    const items: ASTBlockNode[] = [];
    for (const r of roots) {
      const kind = cd.kindOf(r);
      if (kind === RowKind.Void) {
        const stashed = cd.attrsOf(r)?.['stashed'] as { content?: ASTInlineNode[] } | undefined;
        if (stashed?.content) items.push({ type: 'list-item', content: structuredClone(stashed.content) });
      } else if (kind === RowKind.Container) {
        for (const c of childrenOf(cd, r)) items.push(blockFromRow(cd, c));
      } else {
        items.push({ type: 'list-item', content: inlineNodesOf(cd, r) });
      }
    }
    return withSpanOp(cd, startTop, count, () => {
      replaceRoots(cd, startTop, count, [{ type: finalType, ...(attrs ? { attrs } : {}), content: items }]);
      return caretSel(flatPosOfBlockChar(cd, { blockIndex: startTop, itemIndex: 0, charOffset: 0 }));
    });
  }

  if (finalType === 'code-block') {
    // Flatten the range into one code block, one line per holder.
    const parts: string[] = [];
    for (const r of roots) {
      const kind = cd.kindOf(r);
      if (kind === RowKind.Container) parts.push(childrenOf(cd, r).map((c) => cd.textOf(c)).join('\n'));
      else if (kind === RowKind.Void) parts.push('');
      else parts.push(cd.textOf(r));
    }
    const rawText = parts.join('\n');
    return withSpanOp(cd, startTop, count, () => {
      replaceRoots(cd, startTop, count, [{ type: 'code-block', content: [{ type: 'text', text: rawText }] }]);
      return caretSel(flatPosOfBlockChar(cd, { blockIndex: startTop, charOffset: rawText.length }));
    });
  }

  if (allMatch && targetType === 'code-block') {
    // Explode a code block back into one paragraph per line.
    const out: ASTBlockNode[] = [];
    for (const r of roots) {
      for (const line of cd.textOf(r).split('\n')) {
        out.push({ type: 'paragraph', content: [{ type: 'text', text: line }] });
      }
    }
    return withSpanOp(cd, startTop, count, () => {
      replaceRoots(cd, startTop, count, out);
      return caretSel(flatPosOfBlockChar(cd, { blockIndex: startTop, charOffset: 0 }));
    });
  }

  // Per-block conversion, stashing through void targets.
  const finalAttrs = allMatch ? undefined : attrs;
  const finalIsVoid = finalBehavior?.category === 'void';
  const finalIsText = finalBehavior?.category === 'text';
  const toTarget = (srcType: string, srcAttrs: Record<string, unknown> | undefined, content: ASTInlineNode[]): ASTBlockNode => {
    if (finalIsVoid) {
      return {
        type: finalType,
        attrs: {
          ...(finalAttrs ?? {}),
          stashed: { type: srcType, attrs: srcAttrs ? structuredClone(srcAttrs) : undefined, content: structuredClone(content) },
        },
        content: [],
      };
    }
    return { type: finalType, ...(finalAttrs ? { attrs: finalAttrs } : {}), content: structuredClone(content) };
  };

  const out: ASTBlockNode[] = [];
  for (const r of roots) {
    const category = blocks.get(cd.typeOf(r))?.category;
    if (category === 'container' && finalType !== cd.typeOf(r)) {
      for (const c of childrenOf(cd, r)) out.push(toTarget(cd.typeOf(c), cd.attrsOf(c), inlineNodesOf(cd, c)));
    } else if (category === 'text') {
      out.push(toTarget(cd.typeOf(r), cd.attrsOf(r), inlineNodesOf(cd, r)));
    } else if (category === 'void' && finalIsText) {
      const stashed = cd.attrsOf(r)?.['stashed'] as { content?: ASTInlineNode[] } | undefined;
      out.push({
        type: finalType,
        ...(finalAttrs ? { attrs: finalAttrs } : {}),
        content: stashed?.content ? structuredClone(stashed.content) : [{ type: 'text', text: '' }],
      });
    } else {
      out.push(blockFromRow(cd, r));
    }
  }

  // The selection keeps its block/character shape, dropped onto the new blocks.
  const bpFrom = blockPointAt(cd, sel.from);
  const bpTo = sel.from === sel.to ? bpFrom : blockPointAt(cd, sel.to);
  return withSpanOp(cd, startTop, count, () => {
    replaceRoots(cd, startTop, count, out);
    const from = flatPosOfBlockChar(cd, { blockIndex: bpFrom.blockIndex, charOffset: bpFrom.charOffset });
    const to = sel.from === sel.to ? from : flatPosOfBlockChar(cd, { blockIndex: bpTo.blockIndex, charOffset: bpTo.charOffset });
    return { from, to };
  });
}

/** Merged `[start, end)` intervals of one mark type over a row. */
function typeIntervals(cd: ColumnarDocument, row: number, markType: string): [number, number][] {
  const [qFrom, qTo] = cd.runRangeOf(row);
  const quads = cd.markRuns;
  const out: [number, number][] = [];
  for (let q = qFrom; q < qTo; q++) {
    if (cd.markDefs[quads[q * 4 + 3]].type !== markType) continue;
    const start = quads[q * 4 + 1];
    const end = quads[q * 4 + 2];
    const last = out[out.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  }
  return out;
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

  // The text rows the range crosses, with the local extent in each.
  const segments: { row: number; s: number; e: number }[] = [];
  for (let r = a.row; r <= b.row; r++) {
    if (cd.kindOf(r) !== RowKind.Text) continue;
    segments.push({
      row: r,
      s: r === a.row ? a.offset : 0,
      e: r === b.row ? b.offset : cd.textOf(r).length,
    });
  }

  const active = segments.filter((seg) => seg.e > seg.s);
  const fullyMarked = (seg: { row: number; s: number; e: number }) =>
    typeIntervals(cd, seg.row, markType).some(([s, e]) => s <= seg.s && e >= seg.e);
  const allMarked = active.length > 0 && active.every(fullyMarked);
  const mode: 'add' | 'remove' = force ?? (allMarked ? 'remove' : 'add');

  return withSpanOp(cd, baseTop, lastTop - baseTop + 1, () => {
    const mark: ASTMark = { type: markType };
    if (attrs && Object.keys(attrs).length > 0) mark.attrs = attrs;

    for (const seg of active) {
      const runs = runsOfRow(cd, seg.row);
      const next: Run[] = [];
      for (const run of runs) {
        if (run.mark.type !== markType) {
          next.push(run);
          continue;
        }
        if (mode === 'add' && !force) {
          // A plain toggle keeps existing same-type coverage (and its attrs);
          // only the gaps gain the new mark.
          next.push(run);
          continue;
        }
        // Remove — or force-add, which replaces attrs — subtracts the range.
        if (run.start < seg.s) next.push({ start: run.start, end: Math.min(run.end, seg.s), mark: run.mark });
        if (run.end > seg.e) next.push({ start: Math.max(run.start, seg.e), end: run.end, mark: run.mark });
      }
      if (mode === 'add') next.push({ start: seg.s, end: seg.e, mark: cloneMark(mark) });
      cd.setMarks(seg.row, next);
    }
    return { from: sel.from, to: sel.to };
  });
}

/**
 * Replace `count` top-level blocks at `at` with `newBlocks`, as one op. The
 * caller supplies the selection afterwards — these are block-level UI
 * operations (drag reorder, image edits, DOM reconciliation) that leave the
 * caret where it was.
 */
export function replaceBlocksOp(
  cd: ColumnarDocument,
  at: number,
  count: number,
  newBlocks: ASTBlockNode[],
  selAfter: LogicalSelection
): ColumnarMutation | null {
  return withSpanOp(cd, at, count, () => {
    replaceRoots(cd, at, count, newBlocks);
    return selAfter;
  });
}

/** Replace one top-level block with a pasted fragment; caret after its end. */
export function replaceBlockWithFragmentOp(
  cd: ColumnarDocument,
  index: number,
  fragment: ASTDocument
): ColumnarMutation | { op: null; selAfter: LogicalSelection } | null {
  if (!fragment.length || index < 0 || index >= countTops(cd)) return null;
  let selAfter: LogicalSelection | null = null;
  const mutation = withSpanOp(cd, index, 1, () => {
    replaceRoots(cd, index, 1, structuredClone(fragment));
    const edge = Number.MAX_SAFE_INTEGER;
    return (selAfter = caretSel(flatPosOfBlockChar(cd, { blockIndex: index + fragment.length - 1, itemIndex: edge, charOffset: edge })));
  });
  if (mutation) return mutation;
  // Pasting a copy of the block over itself (hr onto hr) nets no op; the
  // block still deselects and the caret lands after it.
  return selAfter ? { op: null, selAfter } : null;
}

/** Delete a top-level block; an emptied document becomes one empty paragraph. */
export function deleteBlockOp(cd: ColumnarDocument, index: number): ColumnarMutation | null {
  const tops = countTops(cd);
  if (index < 0 || index >= tops) return null;
  return withSpanOp(cd, index, 1, () => {
    replaceRoots(cd, index, 1, tops === 1 ? [emptyParagraph()] : []);
    const caretTop = Math.min(index, countTops(cd) - 1);
    return caretSel(flatPosOfBlockChar(cd, { blockIndex: caretTop, charOffset: 0 }));
  });
}

/**
 * The StepMap a remote op produces, with diffFlat's exact association
 * semantics, computed against the columnar document without materializing the
 * whole tree.
 *
 * diffFlat compares the old and new documents pairwise by block index from
 * both ends. Every pair before the op site is the same block, and every pair
 * counted from the ends beyond the op's reach is the same block at
 * tail-alignment — those contribute their whole sizes without comparison. The
 * loops below start where diffFlat's trimming could first stop: at the op
 * site, materializing blocks lazily and sliding onward exactly as diffFlat
 * would when replaced content equals its neighbours. Do NOT replace this with
 * stepMapFromOp — the two disagree on 7.5% of mapped positions (association
 * at insertion boundaries), and the fuzz spec holds this to the diffFlat
 * oracle.
 */
export function remoteStepMap(cd: ColumnarDocument, op: EditorOp): StepMap | null {
  const tops = countTops(cd);
  const rootRows: number[] = [];
  for (let r = 0; r < cd.rows; r++) if (cd.parentOf(r) === -1) rootRows.push(r);

  const memo = new Map<number, ASTBlockNode>();
  const oldAt = (i: number): ASTBlockNode => {
    let block = memo.get(i);
    if (!block) {
      block = blockFromRow(cd, rootRows[i]);
      memo.set(i, block);
    }
    return block;
  };
  const startOfTop = (i: number): number => (i >= tops ? cd.size : cd.startOf(rootRows[i]));

  let at: number;
  let removedCount: number;
  let inserted: ASTBlockNode[];
  if (op.kind === 'inline') {
    if (op.blockIndex < 0 || op.blockIndex >= tops) return null;
    // applyOp only no-ops on container content; a void's empty content passes
    // its isInlineContent check and gains the fragment.
    if (cd.kindOf(rootRows[op.blockIndex]) === RowKind.Container) return null;
    at = op.blockIndex;
    removedCount = 1;
    const oldBlock = oldAt(at);
    const content = spliceInlineContent(oldBlock.content as ASTInlineNode[], op.at, fragLen(op.removed), op.inserted);
    inserted = [{ ...oldBlock, content }];
  } else {
    at = Math.min(Math.max(0, op.at), tops);
    removedCount = Math.max(0, Math.min(op.removed.length, tops - at));
    inserted = op.inserted;
  }
  const insertedCount = inserted.length;

  const lenA = cd.size;
  const lenB = lenA - (startOfTop(at + removedCount) - startOfTop(at)) + docSize(inserted);
  const oldLen = tops;
  const newLen = tops - removedCount + insertedCount;
  const newAt = (i: number): ASTBlockNode =>
    i < at ? oldAt(i) : i < at + insertedCount ? inserted[i - at] : oldAt(i - insertedCount + removedCount);

  // Longest common prefix, in tokens; pairs before the op site match wholly.
  let start = startOfTop(at);
  for (let i = at; i < oldLen && i < newLen; i++) {
    const shared = sharedPrefix(oldAt(i), newAt(i));
    start += shared.tokens;
    if (!shared.whole) break;
  }
  if (start > lenA) start = lenA;
  if (start > lenB) start = lenB;

  // Longest common suffix; pairs past the op's reach match wholly at
  // tail-alignment, contributing everything after the removed span.
  const tailCount = oldLen - (at + removedCount);
  let suffix = lenA - startOfTop(at + removedCount);
  const maxSuffix = Math.min(lenA - start, lenB - start);
  for (let i = tailCount; i < oldLen && i < newLen; i++) {
    const shared = sharedSuffix(oldAt(oldLen - 1 - i), newAt(newLen - 1 - i));
    suffix += shared.tokens;
    if (!shared.whole) break;
  }
  if (suffix > maxSuffix) suffix = maxSuffix;

  const endA = lenA - suffix;
  const endB = lenB - suffix;
  if (start === endA && start === endB) return null;
  return new StepMap([[start, endA - start, endB - start]]);
}
