/**
 * Minimal structural types for the MSE buffer layer so engine code never
 * references DOM MSE types directly. Anything satisfying these shapes works,
 * which keeps the layer runnable in jsdom with a mock double.
 */

export type TimeRangesLike = {
  length: number;
  start(i: number): number;
  end(i: number): number;
};

export type SourceBufferLike = {
  updating: boolean;
  buffered: TimeRangesLike;
  timestampOffset: number;
  appendBuffer(data: BufferSource): void;
  remove(start: number, end: number): void;
  abort(): void;
  addEventListener(type: 'updateend' | 'error', fn: () => void): void;
  removeEventListener(type: 'updateend' | 'error', fn: () => void): void;
};

/** Tolerance (seconds) for treating a playhead just before a range as inside it. */
const ADJACENCY_TOLERANCE = 0.5;

/** Materializes a `TimeRangesLike` into a plain array of `{ start, end }` ranges. */
export function bufferedToRanges(b: TimeRangesLike): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < b.length; i++) {
    ranges.push({ start: b.start(i), end: b.end(i) });
  }
  return ranges;
}

/**
 * Seconds of contiguous buffer ahead of `currentTime`.
 * Returns 0 when `currentTime` is not inside a range, nor within 0.5s before
 * one. Ranges are assumed sorted and disjoint (as MSE guarantees).
 */
export function forwardBufferLength(b: TimeRangesLike, currentTime: number): number {
  for (let i = 0; i < b.length; i++) {
    const start = b.start(i);
    const end = b.end(i);
    if (currentTime >= start - ADJACENCY_TOLERANCE && currentTime < end) {
      return end - currentTime;
    }
  }
  return 0;
}
