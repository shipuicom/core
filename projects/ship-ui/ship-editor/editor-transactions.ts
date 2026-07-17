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

export type EditorOp = BlockSplice | InlineSplice;

export interface EditorTransaction {

  baseVersion: number;
  op: EditorOp;
  selBefore: LogicalSelection | null;
  selAfter: LogicalSelection | null;
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
  return { ...op, removed: op.inserted, inserted: op.removed } as EditorOp;
}

export function applyOp(doc: ASTDocument, op: EditorOp): ASTDocument {
  if (op.kind === 'block') {
    return [...doc.slice(0, op.at), ...structuredClone(op.inserted), ...doc.slice(op.at + op.removed.length)];
  }
  const block = doc[op.blockIndex];
  if (!block || !isInlineContent(block.content)) return doc;
  const content = spliceInlineContent(block.content, op.at, fragLen(op.removed), op.inserted);
  const next = [...doc];
  next[op.blockIndex] = { ...block, content };
  return next;
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
      if (at === null) return null;
      return at === op.at ? op : { ...op, at };
    }

    const aEnd = against.at + against.removed.length;
    if (aEnd <= op.blockIndex) return delta === 0 ? op : { ...op, blockIndex: op.blockIndex + delta };
    if (op.blockIndex < against.at) return op;
    return null;
  }

  if (op.kind === 'inline') {
    if (op.blockIndex !== against.blockIndex) return op;
    const at = shiftIndex(op.at, fragLen(op.removed), against.at, fragLen(against.removed), fragLen(against.inserted), side);
    if (at === null) return null;
    return at === op.at ? op : { ...op, at };
  }

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
