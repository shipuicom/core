import { describe, expect, it } from 'vitest';
import { Ewma } from './ewma';

describe('Ewma', () => {
  it('starts with a zero estimate and zero total weight', () => {
    const ewma = new Ewma(3);
    expect(ewma.getEstimate()).toBe(0);
    expect(ewma.getTotalWeight()).toBe(0);
  });

  it('rejects a non-positive half-life', () => {
    expect(() => new Ewma(0)).toThrow(RangeError);
    expect(() => new Ewma(-1)).toThrow(RangeError);
  });

  it('bias correction makes the first sample exact', () => {
    const ewma = new Ewma(3);
    ewma.sample(1, 5_000_000);
    expect(ewma.getEstimate()).toBeCloseTo(5_000_000, 6);
  });

  it('converges to a constant input', () => {
    const ewma = new Ewma(2);
    for (let i = 0; i < 50; i++) {
      ewma.sample(1, 1_000_000);
    }
    expect(ewma.getEstimate()).toBeCloseTo(1_000_000, 4);
  });

  it('stays exact for constant input even with few samples', () => {
    const ewma = new Ewma(10);
    ewma.sample(0.5, 42);
    ewma.sample(2, 42);
    expect(ewma.getEstimate()).toBeCloseTo(42, 8);
  });

  it('weights recent samples more with a small half-life', () => {
    const fast = new Ewma(1);
    const slow = new Ewma(20);
    for (const ewma of [fast, slow]) {
      for (let i = 0; i < 10; i++) {
        ewma.sample(1, 8_000_000);
      }
      ewma.sample(1, 1_000_000);
    }
    // Fast tracker moves much closer to the newest sample than the slow one.
    expect(fast.getEstimate()).toBeLessThan(slow.getEstimate());
    expect(fast.getEstimate()).toBeLessThan(4_500_000);
    expect(slow.getEstimate()).toBeGreaterThan(7_000_000);
  });

  it('larger sample weight pulls the estimate further toward the value', () => {
    const light = new Ewma(3);
    const heavy = new Ewma(3);
    light.sample(1, 100);
    heavy.sample(1, 100);
    light.sample(0.5, 200);
    heavy.sample(4, 200);
    expect(heavy.getEstimate()).toBeGreaterThan(light.getEstimate());
  });

  it('accumulates total weight across samples', () => {
    const ewma = new Ewma(3);
    ewma.sample(0.5, 1);
    ewma.sample(1.5, 1);
    expect(ewma.getTotalWeight()).toBeCloseTo(2, 8);
  });

  it('ignores non-positive weights and non-finite values', () => {
    const ewma = new Ewma(3);
    ewma.sample(0, 100);
    ewma.sample(-1, 100);
    ewma.sample(1, NaN);
    ewma.sample(1, Infinity);
    expect(ewma.getTotalWeight()).toBe(0);
    expect(ewma.getEstimate()).toBe(0);
  });
});
