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
