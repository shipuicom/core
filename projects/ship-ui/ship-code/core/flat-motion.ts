// ---------------------------------------------------------------------------
// ShipCode — Flat Selection & Caret Motion
// ---------------------------------------------------------------------------
//
// The canonical selection model of the view layer: flat `{anchor, head}`
// offsets (ship-editor's flat-selection shape), with line/column derived at
// the boundary through the LineIndex. Character motion is arithmetic —
// `pos ± 1` crosses line boundaries by construction because newlines occupy
// one flat slot. Vertical motion carries a goal column, the classic sticky-
// column behavior.

import {
  moveLineEnd,
  moveLineStart,
  moveWordLeft,
  moveWordRight,
  selectLine,
  selectWord,
} from './caret-motion';
import { CodeDocument } from './document';
import { FlatPos, indexFor } from './line-index';

/**
 * One selection range. `goalColumn` is the remembered column for vertical
 * motion; it survives moving over shorter lines and resets on any horizontal
 * move.
 */
export interface FlatRange {
  readonly anchor: FlatPos;
  readonly head: FlatPos;
  readonly goalColumn?: number;
}

/**
 * The full selection: one range per cursor, ascending and disjoint (see
 * `flat-multi`, which owns that invariant), plus the index of the primary —
 * the cursor the native caret follows and the only one scroll-into-view obeys.
 * Absent `primary` means the first range, so a single-range selection can
 * still be written as a bare `{ ranges: [...] }`.
 */
export interface FlatSelection {
  readonly ranges: readonly FlatRange[];
  readonly primary?: number;
}

export const flatCaret = (pos: FlatPos): FlatSelection => ({ ranges: [{ anchor: pos, head: pos }], primary: 0 });
export const flatRange = (anchor: FlatPos, head: FlatPos): FlatSelection => ({ ranges: [{ anchor, head }], primary: 0 });
export const isFlatCollapsed = (range: FlatRange): boolean => range.anchor === range.head;
export const flatOrdered = (range: FlatRange): { from: FlatPos; to: FlatPos } =>
  range.anchor <= range.head ? { from: range.anchor, to: range.head } : { from: range.head, to: range.anchor };
export const primaryFlat = (sel: FlatSelection): FlatRange => sel.ranges[sel.primary ?? 0] ?? sel.ranges[0];

/** A motion result: the new head plus the goal column vertical motion keeps. */
export interface MotionResult {
  readonly head: FlatPos;
  readonly goalColumn?: number;
}

const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff;
const isLowSurrogate = (code: number) => code >= 0xdc00 && code <= 0xdfff;

/**
 * How many code units one horizontal step covers at `pos`: 2 across a
 * surrogate pair, else 1. Flat positions are UTF-16 code-unit offsets, and a
 * caret (or a one-character delete) must never land between the halves of an
 * astral character — that strands a lone surrogate in the document.
 */
export function flatStepRight(doc: CodeDocument, pos: FlatPos): number {
  const point = indexFor(doc).pointAt(pos);
  const text = doc.lines[point.line].text;
  return isHighSurrogate(text.charCodeAt(point.column)) && isLowSurrogate(text.charCodeAt(point.column + 1)) ? 2 : 1;
}

export function flatStepLeft(doc: CodeDocument, pos: FlatPos): number {
  const point = indexFor(doc).pointAt(pos);
  const text = doc.lines[point.line].text;
  return point.column >= 2 && isLowSurrogate(text.charCodeAt(point.column - 1)) && isHighSurrogate(text.charCodeAt(point.column - 2))
    ? 2
    : 1;
}

export function flatMoveRight(doc: CodeDocument, pos: FlatPos): MotionResult {
  const size = indexFor(doc).size;
  if (pos >= size) return { head: size };
  return { head: Math.min(pos + flatStepRight(doc, pos), size) };
}

export function flatMoveLeft(doc: CodeDocument, pos: FlatPos): MotionResult {
  if (pos <= 0) return { head: 0 };
  return { head: Math.max(pos - flatStepLeft(doc, pos), 0) };
}

export function flatMoveUp(doc: CodeDocument, pos: FlatPos, goalColumn?: number): MotionResult {
  return verticalMove(doc, pos, -1, goalColumn);
}

export function flatMoveDown(doc: CodeDocument, pos: FlatPos, goalColumn?: number): MotionResult {
  return verticalMove(doc, pos, 1, goalColumn);
}

function verticalMove(doc: CodeDocument, pos: FlatPos, delta: -1 | 1, goalColumn?: number): MotionResult {
  const index = indexFor(doc);
  const point = index.pointAt(pos);
  const goal = goalColumn ?? point.column;
  const targetLine = point.line + delta;
  if (targetLine < 0) return { head: 0, goalColumn: goal };
  if (targetLine >= index.lineCount) return { head: index.size, goalColumn: goal };
  return { head: index.posOf({ line: targetLine, column: goal }), goalColumn: goal };
}

export function flatMoveWordLeft(doc: CodeDocument, pos: FlatPos): MotionResult {
  const index = indexFor(doc);
  return { head: index.posOf(moveWordLeft(doc, index.pointAt(pos))) };
}

export function flatMoveWordRight(doc: CodeDocument, pos: FlatPos): MotionResult {
  const index = indexFor(doc);
  return { head: index.posOf(moveWordRight(doc, index.pointAt(pos))) };
}

export function flatMoveLineStart(doc: CodeDocument, pos: FlatPos): MotionResult {
  const index = indexFor(doc);
  return { head: index.posOf(moveLineStart(doc, index.pointAt(pos))) };
}

export function flatMoveLineEnd(doc: CodeDocument, pos: FlatPos): MotionResult {
  const index = indexFor(doc);
  return { head: index.posOf(moveLineEnd(doc, index.pointAt(pos))) };
}

export function flatMoveDocStart(): MotionResult {
  return { head: 0 };
}

export function flatMoveDocEnd(doc: CodeDocument): MotionResult {
  return { head: indexFor(doc).size };
}

export function flatSelectWord(doc: CodeDocument, pos: FlatPos): FlatRange {
  const index = indexFor(doc);
  const range = selectWord(doc, index.pointAt(pos));
  return { anchor: index.posOf(range.anchor), head: index.posOf(range.head) };
}

export function flatSelectLine(doc: CodeDocument, pos: FlatPos): FlatRange {
  const index = indexFor(doc);
  const range = selectLine(doc, index.pointAt(pos));
  return { anchor: index.posOf(range.anchor), head: index.posOf(range.head) };
}

export function flatSelectAll(doc: CodeDocument): FlatRange {
  return { anchor: 0, head: indexFor(doc).size };
}

// ---------------------------------------------------------------------------
// Applying motion to a selection
// ---------------------------------------------------------------------------

/**
 * Apply a motion to the primary range. `extend` keeps the anchor (Shift+move);
 * a plain move collapses to the head — except that a plain horizontal move on
 * a non-collapsed selection collapses to the range edge first, matching every
 * mainstream editor.
 */
export function applyMotion(
  sel: FlatSelection,
  motion: MotionResult,
  extend: boolean,
  collapseEdge?: 'from' | 'to'
): FlatSelection {
  const range = primaryFlat(sel);
  if (extend) return { ranges: [{ anchor: range.anchor, head: motion.head, goalColumn: motion.goalColumn }] };
  if (collapseEdge && !isFlatCollapsed(range)) {
    const { from, to } = flatOrdered(range);
    const at = collapseEdge === 'from' ? from : to;
    return { ranges: [{ anchor: at, head: at, goalColumn: motion.goalColumn }] };
  }
  return { ranges: [{ anchor: motion.head, head: motion.head, goalColumn: motion.goalColumn }] };
}
