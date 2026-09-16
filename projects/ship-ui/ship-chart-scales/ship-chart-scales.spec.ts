import { describe, expect, it } from 'vitest';
import { areaPath, extent, linearScale, linePath, niceDomain, niceTicks } from './ship-chart-scales';

describe('ship-chart-scales', () => {
  it('finds the extent and ignores non-finite values', () => {
    expect(extent([3, NaN, -1, 7, Infinity])).toEqual([-1, 7]);
    expect(extent([])).toEqual([0, 1]);
  });

  it('maps and inverts a linear scale', () => {
    const scale = linearScale([0, 10], [0, 100]);
    expect(scale(2.5)).toBe(25);
    expect(scale.invert(75)).toBe(7.5);
    expect(linearScale([5, 5], [0, 100])(5)).toBe(50);
  });

  it('produces nice ticks and domains', () => {
    expect(niceTicks([0, 100], 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks([0.13, 0.87], 4)).toEqual([0.2, 0.4, 0.6, 0.8]);
    expect(niceDomain([13, 87], 5)).toEqual([0, 100]);
    expect(niceTicks([4, 4])).toEqual([4]);
  });

  it('builds line and area paths', () => {
    const points = [
      { x: 0, y: 10 },
      { x: 10, y: 0 },
      { x: 20, y: 5 },
    ];
    expect(linePath(points)).toBe('M0,10L10,0L20,5');
    expect(linePath(points, 'step')).toBe('M0,10L5,10L5,0L10,0L15,0L15,5L20,5');
    expect(areaPath(points, 10)).toBe('M0,10L10,0L20,5L20,10L0,10Z');
    expect(linePath(points, 'monotone').startsWith('M0,10C')).toBe(true);
    expect(linePath([])).toBe('');
    expect(linePath([{ x: 1.5, y: 2.25 }])).toBe('M1.5,2.25');
  });
});
