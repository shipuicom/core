import { describe, it, expect } from 'vitest';
import {
  caret,
  collapsedSelection,
  selection,
  isCollapsed,
  primaryRange,
  primaryCaret,
  comparePositions,
  isBefore,
  isAfter,
  isEqual,
  rangeOrdered,
} from './selection';

describe('CaretPosition', () => {
  it('should create a position with line and column', () => {
    const pos = caret(2, 5);
    expect(pos.line).toBe(2);
    expect(pos.column).toBe(5);
  });
});

describe('SelectionState', () => {
  it('should create a collapsed selection (caret only)', () => {
    const state = collapsedSelection(caret(0, 0));
    expect(state.ranges).toHaveLength(1);
    expect(isCollapsed(state.ranges[0])).toBe(true);
  });

  it('should create a non-collapsed selection', () => {
    const state = selection(caret(0, 0), caret(0, 5));
    expect(state.ranges).toHaveLength(1);
    expect(isCollapsed(state.ranges[0])).toBe(false);
  });

  it('should identify collapsed range correctly', () => {
    expect(isCollapsed({ anchor: caret(1, 3), head: caret(1, 3) })).toBe(true);
    expect(isCollapsed({ anchor: caret(1, 3), head: caret(1, 4) })).toBe(false);
    expect(isCollapsed({ anchor: caret(1, 3), head: caret(2, 3) })).toBe(false);
  });

  it('should return primary range', () => {
    const state = selection(caret(0, 0), caret(0, 5));
    const range = primaryRange(state);
    expect(range.anchor).toEqual(caret(0, 0));
    expect(range.head).toEqual(caret(0, 5));
  });

  it('should return primary caret position', () => {
    const state = selection(caret(0, 0), caret(2, 10));
    expect(primaryCaret(state)).toEqual(caret(2, 10));
  });

  it('should support multiple ranges (multi-caret)', () => {
    const state = {
      ranges: [
        { anchor: caret(0, 5), head: caret(0, 5) },
        { anchor: caret(1, 5), head: caret(1, 5) },
        { anchor: caret(2, 5), head: caret(2, 5) },
      ],
    };
    expect(state.ranges).toHaveLength(3);
    expect(primaryCaret(state)).toEqual(caret(0, 5));
  });
});

describe('comparePositions', () => {
  it('should return -1 when a is before b (same line)', () => {
    expect(comparePositions(caret(0, 2), caret(0, 5))).toBe(-1);
  });

  it('should return -1 when a is on earlier line', () => {
    expect(comparePositions(caret(0, 10), caret(1, 0))).toBe(-1);
  });

  it('should return 1 when a is after b (same line)', () => {
    expect(comparePositions(caret(0, 5), caret(0, 2))).toBe(1);
  });

  it('should return 1 when a is on later line', () => {
    expect(comparePositions(caret(2, 0), caret(1, 99))).toBe(1);
  });

  it('should return 0 when positions are equal', () => {
    expect(comparePositions(caret(3, 7), caret(3, 7))).toBe(0);
  });
});

describe('isBefore / isAfter / isEqual', () => {
  it('isBefore is true when a < b', () => {
    expect(isBefore(caret(0, 0), caret(0, 1))).toBe(true);
    expect(isBefore(caret(0, 0), caret(1, 0))).toBe(true);
  });

  it('isBefore is false when a >= b', () => {
    expect(isBefore(caret(0, 1), caret(0, 1))).toBe(false);
    expect(isBefore(caret(0, 2), caret(0, 1))).toBe(false);
  });

  it('isAfter is true when a > b', () => {
    expect(isAfter(caret(0, 5), caret(0, 3))).toBe(true);
  });

  it('isAfter is false when a <= b', () => {
    expect(isAfter(caret(0, 3), caret(0, 3))).toBe(false);
  });

  it('isEqual returns true for equal positions', () => {
    expect(isEqual(caret(2, 5), caret(2, 5))).toBe(true);
  });

  it('isEqual returns false for different positions', () => {
    expect(isEqual(caret(2, 5), caret(2, 6))).toBe(false);
    expect(isEqual(caret(2, 5), caret(3, 5))).toBe(false);
  });
});

describe('rangeOrdered', () => {
  it('should return anchor as start when forward selection', () => {
    const range = { anchor: caret(0, 0), head: caret(0, 10) };
    const ordered = rangeOrdered(range);
    expect(ordered.start).toEqual(caret(0, 0));
    expect(ordered.end).toEqual(caret(0, 10));
  });

  it('should swap when backward selection (head before anchor)', () => {
    const range = { anchor: caret(0, 10), head: caret(0, 0) };
    const ordered = rangeOrdered(range);
    expect(ordered.start).toEqual(caret(0, 0));
    expect(ordered.end).toEqual(caret(0, 10));
  });

  it('should handle collapsed range', () => {
    const range = { anchor: caret(3, 5), head: caret(3, 5) };
    const ordered = rangeOrdered(range);
    expect(ordered.start).toEqual(caret(3, 5));
    expect(ordered.end).toEqual(caret(3, 5));
  });

  it('should handle multi-line backward selection', () => {
    const range = { anchor: caret(5, 0), head: caret(2, 3) };
    const ordered = rangeOrdered(range);
    expect(ordered.start).toEqual(caret(2, 3));
    expect(ordered.end).toEqual(caret(5, 0));
  });
});
