import { ColumnarDocument, ColumnarRowInput, RowKind, toColumnar } from './editor-columnar';
import { EditorOp } from './editor-transactions';
import { ASTBlockNode, ASTInlineNode, ASTMark } from './editor.types';

/**
 * Applies the engine's `EditorOp` to a columnar document in place.
 *
 * This is what lets columnar hold the document rather than mirror it: the engine
 * already produces an op for every change, so the columnar model can be advanced
 * incrementally instead of being rebuilt. Rebuilding via `toColumnar` costs
 * O(document) per keystroke, which is the cost the model exists to avoid.
 */

function fragText(nodes: ASTInlineNode[]): string {
  let text = '';
  for (const node of nodes) text += node.text ?? '';
  return text;
}

function fragLen(nodes: ASTInlineNode[]): number {
  let len = 0;
  for (const node of nodes) len += node.text?.length ?? 0;
  return len;
}

/** Mark ranges carried by an inline fragment, relative to the fragment's own text. */
function fragMarks(nodes: ASTInlineNode[]): { start: number; end: number; mark: ASTMark }[] {
  const out: { start: number; end: number; mark: ASTMark }[] = [];
  let cursor = 0;
  for (const node of nodes) {
    const len = node.text?.length ?? 0;
    for (const mark of node.marks ?? []) out.push({ start: cursor, end: cursor + len, mark });
    cursor += len;
  }
  return out;
}

function kindOf(block: ASTBlockNode): RowKind {
  const content = block.content as unknown[] | undefined;
  if (!content || content.length === 0) return RowKind.Void;
  return typeof (content[0] as ASTInlineNode)?.text === 'string' ? RowKind.Text : RowKind.Container;
}

/**
 * Flattens a nested block into the rows it occupies, in document order, with
 * parent pointers expressed relative to the first row of the group.
 */
function rowsForBlock(block: ASTBlockNode, depth: number, parentOffset: number, out: ColumnarRowInput[]): void {
  const kind = kindOf(block);
  const index = out.length;

  const row: ColumnarRowInput = {
    type: block.type,
    kind,
    text: kind === RowKind.Text ? fragText(block.content as ASTInlineNode[]) : '',
    depth,
    parent: parentOffset,
  };
  if (block.attrs) row.attrs = { ...block.attrs };
  if (kind === RowKind.Text) {
    const marks = fragMarks(block.content as ASTInlineNode[]);
    if (marks.length) row.marks = marks;
  }
  out.push(row);

  if (kind === RowKind.Container) {
    for (const child of block.content as ASTBlockNode[]) rowsForBlock(child, depth + 1, index, out);
  }
}

/** The rows a set of top-level blocks expands into, ready for `insertRows`. */
export function rowsForBlocks(blocks: ASTBlockNode[], baseRow: number): ColumnarRowInput[] {
  const out: ColumnarRowInput[] = [];
  for (const block of blocks) rowsForBlock(block, 0, -1, out);
  // Parent offsets were relative to the group; rebase them onto absolute rows.
  return out.map((row) => ({
    ...row,
    parent: row.parent === undefined || row.parent < 0 ? -1 : row.parent + baseRow,
  }));
}

/**
 * Advance `cd` by `op`.
 *
 * Inline ops address a character offset inside one top-level block; block ops
 * address a range of top-level blocks. Both have to be translated out of block
 * indices into row indices first, because a container occupies a row of its own
 * plus one per descendant.
 */
export function applyOpToColumnar(cd: ColumnarDocument, op: EditorOp): void {
  if (op.kind === 'inline') {
    const row = cd.rowOfTopLevel(op.blockIndex);
    if (row >= cd.rows) return;

    const removed = fragLen(op.removed);
    if (removed > 0) cd.deleteText(row, op.at, removed);

    const inserted = fragText(op.inserted);
    if (inserted) {
      cd.insertText(row, op.at, inserted);
      const marks = fragMarks(op.inserted);
      if (marks.length) {
        // Existing runs are already shifted by insertText; add the new ones at
        // their absolute offsets rather than replacing the row's marks.
        const existing: { start: number; end: number; mark: ASTMark }[] = [];
        const runs = cd.markRuns;
        for (let i = 0; i < runs.length; i += 4) {
          if (runs[i] !== row) continue;
          existing.push({ start: runs[i + 1], end: runs[i + 2], mark: cd.markDefs[runs[i + 3]] });
        }
        for (const m of marks) existing.push({ start: m.start + op.at, end: m.end + op.at, mark: m.mark });
        cd.setMarks(row, existing);
      }
    }
    return;
  }

  // Block op: remove the rows the old blocks occupied, then insert the new ones.
  const startRow = cd.rowOfTopLevel(op.at);
  let removedRows = 0;
  for (let i = 0; i < op.removed.length; i++) removedRows += cd.rowSpanOfTopLevel(op.at + i);
  if (removedRows > 0) cd.removeRows(startRow, removedRows);

  if (op.inserted.length) cd.insertRows(startRow, rowsForBlocks(op.inserted, startRow));
}

/** Rebuild from scratch — the fallback when an op cannot be applied incrementally. */
export function rebuildColumnar(doc: ASTBlockNode[]): ColumnarDocument {
  return toColumnar(doc);
}
