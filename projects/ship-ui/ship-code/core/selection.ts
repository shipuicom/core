// ---------------------------------------------------------------------------
// ShipCode — Selection & Caret Types
// ---------------------------------------------------------------------------

/**
 * A position in the document: line index + column offset.
 * Both are zero-based.
 */
export interface CaretPosition {
  readonly line: number;
  readonly column: number;
}

/**
 * A selection range defined by an anchor (where the selection started)
 * and a head (where the caret currently is).
 *
 * When anchor === head, the selection is collapsed (just a caret).
 */
export interface SelectionRange {
  readonly anchor: CaretPosition;
  readonly head: CaretPosition;
}

/**
 * The full selection state: an array of selection ranges.
 * Multiple ranges = multi-caret editing.
 */
export interface SelectionState {
  readonly ranges: readonly SelectionRange[];
}

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

/** Create a caret position. */
export function caret(line: number, column: number): CaretPosition {
  return { line, column };
}

/** Create a collapsed selection (just a caret) at the given position. */
export function collapsedSelection(pos: CaretPosition): SelectionState {
  return { ranges: [{ anchor: pos, head: pos }] };
}

/** Create a selection from anchor to head. */
export function selection(anchor: CaretPosition, head: CaretPosition): SelectionState {
  return { ranges: [{ anchor, head }] };
}

/** Check if a selection range is collapsed (anchor === head). */
export function isCollapsed(range: SelectionRange): boolean {
  return range.anchor.line === range.head.line && range.anchor.column === range.head.column;
}

/** Get the primary (first) selection range. */
export function primaryRange(state: SelectionState): SelectionRange {
  return state.ranges[0];
}

/** Get the primary caret position (head of first range). */
export function primaryCaret(state: SelectionState): CaretPosition {
  return state.ranges[0].head;
}

// ---------------------------------------------------------------------------
// Position comparison
// ---------------------------------------------------------------------------

/** Compare two positions. Returns -1 if a < b, 0 if equal, 1 if a > b. */
export function comparePositions(a: CaretPosition, b: CaretPosition): -1 | 0 | 1 {
  if (a.line < b.line) return -1;
  if (a.line > b.line) return 1;
  if (a.column < b.column) return -1;
  if (a.column > b.column) return 1;
  return 0;
}

/** Is position a strictly before position b? */
export function isBefore(a: CaretPosition, b: CaretPosition): boolean {
  return comparePositions(a, b) < 0;
}

/** Is position a strictly after position b? */
export function isAfter(a: CaretPosition, b: CaretPosition): boolean {
  return comparePositions(a, b) > 0;
}

/** Are two positions equal? */
export function isEqual(a: CaretPosition, b: CaretPosition): boolean {
  return a.line === b.line && a.column === b.column;
}

/** Get the ordered (start, end) of a selection range regardless of direction. */
export function rangeOrdered(range: SelectionRange): { start: CaretPosition; end: CaretPosition } {
  if (comparePositions(range.anchor, range.head) <= 0) {
    return { start: range.anchor, end: range.head };
  }
  return { start: range.head, end: range.anchor };
}
