import { resolveInlinePosition } from './editor-ast.utils';
import { ASTBlockNode, ASTDocument, ASTInlineNode, LogicalPosition } from './editor.types';

/**
 * SPIKE — ProseMirror-style flat position addressing over the editor AST.
 *
 * Instead of path addresses ({blockIndex, itemIndex?, charOffset}), the whole
 * document flattens into one token sequence and a position is a single integer:
 *
 * - entering a non-leaf block costs 1 (its opening boundary)
 * - each character of text costs 1
 * - leaving a non-leaf block costs 1
 * - a void block (hr, image) costs exactly 1 and has no interior
 *
 *   doc( p("ab"), ul( li("cd") ) )
 *   0   1   2   3    4    5    6   7   8    9     10
 *    <p>  a   b  </p> <ul> <li>  c   d  </li> </ul>
 *
 * Why: a {@link StepMap} derived from an edit maps ANY position through that
 * edit with plain integer arithmetic, regardless of nesting depth — including
 * through structural changes like a backspace block-merge, where the typed
 * BlockSplice representation fundamentally cannot recover interior cursor
 * correspondence (removed:[b1,b2] → inserted:[merged] says nothing about where
 * old block-2 characters live in the merged block). The flat token diff sees
 * that merge as "2 boundary tokens deleted" and maps every cursor exactly.
 *
 * Scope of the spike: sizes, logical↔flat conversion, StepMap mapping with
 * PM-compatible assoc/deleted semantics, a flat token diff (edit → StepMap),
 * and a bridge from the existing EditorOp model. NOT included (the follow-up
 * if adopted): a ReplaceStep/Slice representation for applying flat steps,
 * open-ended cross-boundary ranges, and engine integration.
 *
 * Block shape is detected structurally, relying on the editor's invariants:
 * text blocks always carry ≥1 inline node (an empty paragraph is
 * [{text:''}]), container items are block nodes, void blocks have empty
 * content.
 */

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

/** Token footprint of one block (PM `nodeSize`): void=1, else 2 + content. */
export function nodeSize(block: ASTBlockNode): number {
  const shape = shapeOf(block);
  if (shape === 'void') return 1;
  if (shape === 'text') return 2 + textLen(block.content as ASTInlineNode[]);
  return 2 + (block.content as ASTBlockNode[]).reduce((n, item) => n + nodeSize(item), 0);
}

export function docSize(doc: ASTDocument): number {
  return doc.reduce((n, b) => n + nodeSize(b), 0);
}

// ---------------------------------------------------------------------------
// Logical ↔ flat conversion
// ---------------------------------------------------------------------------

/** Flat position of a logical caret. A position on a void block is the
 * position just before it. */
export function logicalToPos(doc: ASTDocument, lp: LogicalPosition): number {
  let pos = 0;
  // Clamp against the doc — callers may map historical positions that outlive
  // the block they referenced.
  for (let i = 0; i < lp.blockIndex && i < doc.length; i++) pos += nodeSize(doc[i]);
  const block = doc[lp.blockIndex];
  if (!block) return pos;
  const shape = shapeOf(block);
  if (shape === 'void') return pos;

  pos += 1; // enter the block
  let content = block.content as ASTInlineNode[];
  if (shape === 'container') {
    const items = block.content as ASTBlockNode[];
    const itemIndex = lp.itemIndex ?? 0;
    for (let j = 0; j < itemIndex; j++) pos += nodeSize(items[j]);
    pos += 1; // enter the item
    content = (items[itemIndex]?.content ?? []) as ASTInlineNode[];
  }
  for (let k = 0; k < lp.inlineIndex; k++) pos += content[k]?.text?.length ?? 0;
  return pos + lp.offset;
}

/**
 * Resolve a flat position back to a logical caret. Positions that land on a
 * structure token snap to the nearest valid text position (into the block at
 * an opening token, to the content end at a closing token) — same pragmatic
 * bias `restoreDOMSelection` applies when re-seating a caret.
 */
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

    // container: descend into items
    const items = block.content as ASTBlockNode[];
    let q = Math.max(0, p - 1); // step over the container's opening token
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
    return { blockIndex: bi, itemIndex: 0, inlineIndex: 0, offset: 0 }; // empty container
  }
  return null; // empty document
}

// ---------------------------------------------------------------------------
// StepMap — position mapping through an edit (PM-compatible semantics)
// ---------------------------------------------------------------------------

export interface MapResult {
  pos: number;
  /** True when the position sat strictly inside a replaced range. */
  deleted: boolean;
}

/**
 * A set of replaced ranges, each `[start, oldSize, newSize]` in OLD-document
 * coordinates, sorted and non-overlapping. `map` shifts positions after a
 * range by the size delta; positions inside a range snap to its start
 * (assoc -1) or its new end (assoc +1) — `assoc` is the same tie-break as
 * transformOp's 'left'/'right'.
 */
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

  /** The map of the inverse edit (range starts move to new-doc coordinates). */
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

// ---------------------------------------------------------------------------
// Deriving StepMaps from edits
// ---------------------------------------------------------------------------

/** Encode a document as its token-string sequence (index === flat position). */
function tokens(doc: ASTDocument): string[] {
  const out: string[] = [];
  const pushBlock = (b: ASTBlockNode) => {
    const shape = shapeOf(b);
    const attrs = JSON.stringify(b.attrs ?? null);
    if (shape === 'void') {
      out.push(`v:${b.type}:${attrs}`);
      return;
    }
    out.push(`o:${b.type}:${attrs}`);
    if (shape === 'text') {
      for (const n of b.content as ASTInlineNode[]) {
        const marks = JSON.stringify(n.marks ?? []);
        const text = n.text ?? '';
        for (let i = 0; i < text.length; i++) out.push(`#${text[i]}:${marks}`);
      }
    } else {
      for (const item of b.content as ASTBlockNode[]) pushBlock(item);
    }
    out.push(`c:${b.type}`);
  };
  doc.forEach(pushBlock);
  return out;
}

/**
 * Diff two documents in flat token space into a single-range StepMap, or null
 * when equivalent. Because boundaries and characters share one coordinate
 * space, this stays EXACT through structural edits: a backspace block-merge
 * diffs to "2 boundary tokens removed" and a whole-list item edit diffs to
 * just its changed characters — even where the typed-op diff falls back to a
 * coarse block splice.
 */
export function diffFlat(oldDoc: ASTDocument, newDoc: ASTDocument): StepMap | null {
  const a = tokens(oldDoc);
  const b = tokens(newDoc);
  let start = 0;
  const minLen = Math.min(a.length, b.length);
  while (start < minLen && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  if (start === endA && start === endB) return null;
  return new StepMap([[start, endA - start, endB - start]]);
}

/**
 * Bridge from the existing typed-op model: the StepMap a given EditorOp
 * induces on the flat space. Exact for inline ops; for block splices it can
 * only be range-coarse (interior correspondence was erased by the splice) —
 * the acceptance tests contrast this against diffFlat on the same edit.
 */
export function stepMapFromOp(
  oldDoc: ASTDocument,
  op:
    | { kind: 'block'; at: number; removed: ASTBlockNode[]; inserted: ASTBlockNode[] }
    | { kind: 'inline'; blockIndex: number; at: number; removed: ASTInlineNode[]; inserted: ASTInlineNode[] }
): StepMap {
  if (op.kind === 'inline') {
    let start = 0;
    for (let i = 0; i < op.blockIndex; i++) start += nodeSize(oldDoc[i]);
    start += 1 + op.at; // opening token, then char offset
    return new StepMap([[start, textLen(op.removed), textLen(op.inserted)]]);
  }
  let start = 0;
  for (let i = 0; i < op.at; i++) start += nodeSize(oldDoc[i]);
  const oldSize = op.removed.reduce((n, b) => n + nodeSize(b), 0);
  const newSize = op.inserted.reduce((n, b) => n + nodeSize(b), 0);
  return new StepMap([[start, oldSize, newSize]]);
}
