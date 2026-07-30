import { describe, expect, it } from 'vitest';
import { BlockHeightMap } from './height-map';

describe('BlockHeightMap', () => {
  it('starts fully estimated with the default estimate', () => {
    const map = new BlockHeightMap(10, 40);
    expect(map.count).toBe(10);
    expect(map.estimate).toBe(40);
    expect(map.heightOf(3)).toBe(40);
    expect(map.total()).toBe(400);
    expect(map.prefixHeight(5)).toBe(200);
  });

  it('measurements replace the estimate and drive the rolling average', () => {
    const map = new BlockHeightMap(4, 40);
    expect(map.measure(0, 100)).toBe(true);
    expect(map.measure(1, 50)).toBe(true);
    expect(map.estimate).toBe(75);
    expect(map.heightOf(0)).toBe(100);
    expect(map.heightOf(2)).toBe(75); // unmeasured → rolling average
    expect(map.total()).toBe(100 + 50 + 75 + 75);
  });

  it('re-measuring reports change only past the noise threshold', () => {
    const map = new BlockHeightMap(2, 40);
    map.measure(0, 100);
    expect(map.measure(0, 100.3)).toBe(false); // sub-pixel noise ignored
    expect(map.measure(0, 60)).toBe(true);
    expect(map.heightOf(0)).toBe(60);
    expect(map.estimate).toBe(60);
  });

  it('rejects out-of-range and invalid measurements', () => {
    const map = new BlockHeightMap(2, 40);
    expect(map.measure(-1, 10)).toBe(false);
    expect(map.measure(2, 10)).toBe(false);
    expect(map.measure(0, NaN)).toBe(false);
    expect(map.estimate).toBe(40);
  });

  it('prefixHeight clamps its argument to [0, count]', () => {
    const map = new BlockHeightMap(3, 10);
    expect(map.prefixHeight(-2)).toBe(0);
    expect(map.prefixHeight(99)).toBe(30);
  });

  it('indexAt maps pixel offsets to blocks and clamps at both ends', () => {
    const map = new BlockHeightMap(3, 10);
    map.measure(0, 100);
    map.measure(1, 20);
    map.measure(2, 50);
    expect(map.indexAt(-5)).toBe(0);
    expect(map.indexAt(0)).toBe(0);
    expect(map.indexAt(99)).toBe(0);
    expect(map.indexAt(100)).toBe(1);
    expect(map.indexAt(119)).toBe(1);
    expect(map.indexAt(120)).toBe(2);
    expect(map.indexAt(169)).toBe(2);
    expect(map.indexAt(170)).toBe(2); // past the end → last block
    expect(map.indexAt(1e9)).toBe(2);
  });

  it('splice removes measured blocks from the average and inserts estimated ones', () => {
    const map = new BlockHeightMap(4, 40);
    map.measure(0, 100);
    map.measure(1, 60);
    map.measure(2, 20);
    map.measure(3, 20);
    // Replace blocks 1..2 with three fresh (unmeasured) blocks.
    map.splice(1, 2, 3);
    expect(map.count).toBe(5);
    expect(map.heightOf(0)).toBe(100);
    expect(map.heightOf(4)).toBe(20); // the old block 3, shifted
    expect(map.isMeasured(1)).toBe(false);
    expect(map.estimate).toBe(60); // (100 + 20) / 2
    expect(map.total()).toBe(100 + 60 * 3 + 20);
  });

  it('splice handles pure inserts, pure removals, and edge positions', () => {
    const map = new BlockHeightMap(2, 10);
    map.splice(2, 0, 3); // append
    expect(map.count).toBe(5);
    map.splice(0, 0, 1); // prepend
    expect(map.count).toBe(6);
    map.splice(4, 10, 0); // over-long removal clamps
    expect(map.count).toBe(4);
    expect(map.total()).toBe(40);
  });

  it('the rolling average locks after enough measurements', () => {
    const map = new BlockHeightMap(100, 40);
    for (let i = 0; i < 32; i++) map.measure(i, 50);
    expect(map.estimate).toBe(50);
    // Post-lock, wildly different measurements no longer move the estimate —
    // the pixel model must be deterministic under continued scrolling.
    for (let i = 32; i < 60; i++) map.measure(i, 500);
    expect(map.estimate).toBe(50);
    expect(map.heightOf(40)).toBe(500); // measured values themselves still win
    expect(map.heightOf(99)).toBe(50); // unmeasured stays at the locked estimate
  });

  it('an empty map answers without blowing up', () => {
    const map = new BlockHeightMap(0);
    expect(map.total()).toBe(0);
    expect(map.indexAt(50)).toBe(0);
    map.splice(0, 0, 2);
    expect(map.count).toBe(2);
  });
});
