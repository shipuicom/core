import { describe, expect, it } from 'vitest';
import { BandwidthEstimator } from './bandwidth-estimator';

/** bytes needed for `bitsPerSecond` sustained over `durationMs`. */
function bytesFor(bitsPerSecond: number, durationMs: number): number {
  return (bitsPerSecond * (durationMs / 1000)) / 8;
}

describe('BandwidthEstimator', () => {
  it('cannot estimate before any samples', () => {
    const estimator = new BandwidthEstimator();
    expect(estimator.canEstimate()).toBe(false);
    expect(estimator.getEstimate()).toBe(0);
  });

  it('can estimate after a single 500ms+ sample', () => {
    const estimator = new BandwidthEstimator();
    estimator.sample(500, bytesFor(4_000_000, 500));
    expect(estimator.canEstimate()).toBe(true);
    expect(estimator.getEstimate()).toBeCloseTo(4_000_000, 3);
  });

  it('trusts the estimate after one sample clearing the thresholds', () => {
    const estimator = new BandwidthEstimator();
    estimator.sample(200, bytesFor(4_000_000, 200));
    expect(estimator.canEstimate()).toBe(true);
    expect(estimator.getEstimate()).toBeCloseTo(4_000_000, 3);
  });

  it('aggregates sub-threshold downloads until they are measurable', () => {
    const estimator = new BandwidthEstimator();
    // ten tiny 8ms/8KB downloads: individually unmeasurable, 80ms/80KB combined
    for (let i = 0; i < 10; i++) {
      estimator.sample(8, 8_000);
    }
    expect(estimator.canEstimate()).toBe(true);
    // 80KB over 80ms = 8 Mbps
    expect(estimator.getEstimate()).toBeCloseTo(8_000_000, 3);
  });

  it('converges to a steady throughput', () => {
    const estimator = new BandwidthEstimator();
    for (let i = 0; i < 20; i++) {
      estimator.sample(2000, bytesFor(6_000_000, 2000));
    }
    expect(estimator.getEstimate()).toBeCloseTo(6_000_000, 2);
  });

  it('reports min(fast, slow): reacts pessimistically to a bandwidth drop', () => {
    const estimator = new BandwidthEstimator();
    for (let i = 0; i < 10; i++) {
      estimator.sample(2000, bytesFor(8_000_000, 2000));
    }
    estimator.sample(2000, bytesFor(500_000, 2000));
    const estimate = estimator.getEstimate();
    // Fast EWMA (half-life 3s, 2s sample): ~5.2M — already well under the
    // slow EWMA's ~6.9M, so min(fast, slow) reacts first.
    expect(estimate).toBeLessThan(5_500_000);
    expect(estimate).toBeGreaterThan(500_000);
  });

  it('ramps up cautiously after a bandwidth increase (slow EWMA caps the estimate)', () => {
    const estimator = new BandwidthEstimator();
    for (let i = 0; i < 10; i++) {
      estimator.sample(2000, bytesFor(1_000_000, 2000));
    }
    estimator.sample(2000, bytesFor(20_000_000, 2000));
    const estimate = estimator.getEstimate();
    expect(estimate).toBeGreaterThan(1_000_000);
    expect(estimate).toBeLessThan(10_000_000);
  });

  it('keeps falling toward the new lower rate on sustained congestion', () => {
    const estimator = new BandwidthEstimator();
    for (let i = 0; i < 10; i++) {
      estimator.sample(2000, bytesFor(8_000_000, 2000));
    }
    const before = estimator.getEstimate();
    for (let i = 0; i < 15; i++) {
      estimator.sample(2000, bytesFor(500_000, 2000));
    }
    expect(estimator.getEstimate()).toBeLessThan(before);
    expect(estimator.getEstimate()).toBeGreaterThanOrEqual(500_000);
    expect(estimator.getEstimate()).toBeLessThan(550_000);
  });

  it('ignores samples under minSampleBytes', () => {
    const estimator = new BandwidthEstimator();
    estimator.sample(1000, 15_999);
    expect(estimator.canEstimate()).toBe(false);
    expect(estimator.getEstimate()).toBe(0);
  });

  it('ignores samples under minSampleDurationMs', () => {
    const estimator = new BandwidthEstimator();
    estimator.sample(49, 1_000_000);
    expect(estimator.canEstimate()).toBe(false);
    expect(estimator.getEstimate()).toBe(0);
  });

  it('a tiny cached-response burst does not distort a settled estimate', () => {
    const estimator = new BandwidthEstimator();
    for (let i = 0; i < 5; i++) {
      estimator.sample(2000, bytesFor(2_000_000, 2000));
    }
    const before = estimator.getEstimate();
    estimator.sample(10, 1_000_000); // absurd 800 Mbps burst, under min duration
    expect(estimator.getEstimate()).toBe(before);
  });

  it('honours custom thresholds', () => {
    const estimator = new BandwidthEstimator({ minSampleBytes: 1000, minSampleDurationMs: 10 });
    estimator.sample(500, bytesFor(1_000_000, 500));
    expect(estimator.canEstimate()).toBe(true);
  });

  it('honours custom half-lives (slower slow EWMA is more conservative on ramps)', () => {
    const nimble = new BandwidthEstimator({ fastHalfLife: 1, slowHalfLife: 2 });
    const sluggish = new BandwidthEstimator({ fastHalfLife: 3, slowHalfLife: 30 });
    for (const estimator of [nimble, sluggish]) {
      for (let i = 0; i < 5; i++) {
        estimator.sample(2000, bytesFor(1_000_000, 2000));
      }
      for (let i = 0; i < 5; i++) {
        estimator.sample(2000, bytesFor(10_000_000, 2000));
      }
    }
    expect(nimble.getEstimate()).toBeGreaterThan(sluggish.getEstimate());
  });
});
