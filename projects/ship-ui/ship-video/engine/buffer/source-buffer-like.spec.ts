import { describe, expect, it } from 'vitest';
import { bufferedToRanges, forwardBufferLength } from './source-buffer-like';
import { toTimeRanges } from './mock-media-source';

describe('bufferedToRanges', () => {
  it('returns an empty array for empty ranges', () => {
    expect(bufferedToRanges(toTimeRanges([]))).toEqual([]);
  });

  it('materializes every range in order', () => {
    const ranges = [
      { start: 0, end: 10 },
      { start: 20, end: 30 },
    ];
    expect(bufferedToRanges(toTimeRanges(ranges))).toEqual(ranges);
  });
});

describe('forwardBufferLength', () => {
  it('returns 0 for empty ranges', () => {
    expect(forwardBufferLength(toTimeRanges([]), 5)).toBe(0);
  });

  it('returns the remaining seconds when inside a range', () => {
    const b = toTimeRanges([{ start: 0, end: 10 }]);
    expect(forwardBufferLength(b, 4)).toBe(6);
  });

  it('returns 0 exactly at a range end', () => {
    const b = toTimeRanges([{ start: 0, end: 10 }]);
    expect(forwardBufferLength(b, 10)).toBe(0);
  });

  it('tolerates a playhead up to 0.5s before a range start', () => {
    const b = toTimeRanges([{ start: 5, end: 15 }]);
    expect(forwardBufferLength(b, 4.6)).toBeCloseTo(10.4);
    expect(forwardBufferLength(b, 4.5)).toBeCloseTo(10.5);
  });

  it('returns 0 when the gap before the next range exceeds the tolerance', () => {
    const b = toTimeRanges([{ start: 5, end: 15 }]);
    expect(forwardBufferLength(b, 4.4)).toBe(0);
  });

  it('does not bridge a gap to a later range', () => {
    const b = toTimeRanges([
      { start: 0, end: 10 },
      { start: 12, end: 30 },
    ]);
    expect(forwardBufferLength(b, 8)).toBe(2);
  });

  it('finds the correct range when the playhead sits past a gap', () => {
    const b = toTimeRanges([
      { start: 0, end: 10 },
      { start: 12, end: 30 },
    ]);
    expect(forwardBufferLength(b, 11.6)).toBeCloseTo(18.4);
    expect(forwardBufferLength(b, 10.5)).toBe(0);
  });
});
