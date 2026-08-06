import { describe, expect, it } from 'vitest';
import { nextReloadDelay } from './reload-timing';

describe('nextReloadDelay', () => {
  it.each([
    // [changed, targetDuration, errorCount, expected]
    [true, 6, 0, 6],
    [true, 4, 0, 4],
    [false, 6, 0, 3],
    [false, 4, 0, 2],
    [true, 6, 1, 0.5],
    [false, 6, 1, 0.5],
    [true, 6, 2, 1],
    [true, 6, 3, 2],
    [true, 6, 4, 4],
    [true, 6, 5, 6],
    [true, 6, 10, 6],
    [true, 2, 3, 2],
  ])('changed=%s target=%s errors=%s -> %ss', (changed, targetDuration, errorCount, expected) => {
    expect(nextReloadDelay({ changed, targetDuration, errorCount })).toBe(expected);
  });

  it('caps backoff at the target duration', () => {
    expect(nextReloadDelay({ changed: false, targetDuration: 6, errorCount: 100 })).toBe(6);
  });
});
