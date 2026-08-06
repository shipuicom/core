import { Ewma } from './ewma';

export type BandwidthEstimatorConfig = {
  /** Half-life (seconds) of the fast EWMA. Default 3. */
  fastHalfLife?: number;
  /** Half-life (seconds) of the slow EWMA. Default 9. */
  slowHalfLife?: number;
  /** Samples smaller than this many bytes are ignored. Default 16000. */
  minSampleBytes?: number;
  /** Samples shorter than this many milliseconds are ignored. Default 50. */
  minSampleDurationMs?: number;
};

const DEFAULT_FAST_HALF_LIFE = 3;
const DEFAULT_SLOW_HALF_LIFE = 9;
const DEFAULT_MIN_SAMPLE_BYTES = 16000;
const DEFAULT_MIN_SAMPLE_DURATION_MS = 50;

/**
 * Minimum accumulated weight (download-seconds) before estimates are trusted.
 * One committed aggregate sample (≥50ms) is enough — on fast networks the
 * total download time for a whole buffer of small segments stays tiny.
 */
const MIN_TOTAL_WEIGHT = 0.05;

/**
 * Dual-EWMA throughput estimator over completed segment downloads.
 *
 * The fast average reacts to sudden drops, the slow average smooths out
 * bursts; reporting min(fast, slow) keeps the estimate pessimistic so ABR
 * down-switches early and up-switches cautiously.
 */
export class BandwidthEstimator {
  #fast: Ewma;
  #slow: Ewma;
  #minSampleBytes: number;
  #minSampleDurationMs: number;
  #pendingBytes = 0;
  #pendingMs = 0;

  constructor(config: BandwidthEstimatorConfig = {}) {
    this.#fast = new Ewma(config.fastHalfLife ?? DEFAULT_FAST_HALF_LIFE);
    this.#slow = new Ewma(config.slowHalfLife ?? DEFAULT_SLOW_HALF_LIFE);
    this.#minSampleBytes = config.minSampleBytes ?? DEFAULT_MIN_SAMPLE_BYTES;
    this.#minSampleDurationMs = config.minSampleDurationMs ?? DEFAULT_MIN_SAMPLE_DURATION_MS;
  }

  /**
   * Record one completed segment download. Downloads too small to measure on
   * their own (tiny low-bitrate segments finish in a few ms) accumulate until
   * the aggregate clears the thresholds, instead of being dropped — otherwise
   * a low starting level could never produce an estimate to up-switch from.
   */
  sample(durationMs: number, bytes: number): void {
    if (durationMs <= 0 || bytes <= 0) return;

    this.#pendingMs += durationMs;
    this.#pendingBytes += bytes;
    if (this.#pendingMs < this.#minSampleDurationMs || this.#pendingBytes < this.#minSampleBytes) {
      return;
    }

    const durationSeconds = this.#pendingMs / 1000;
    const bitsPerSecond = (this.#pendingBytes * 8) / durationSeconds;
    this.#pendingMs = 0;
    this.#pendingBytes = 0;
    this.#fast.sample(durationSeconds, bitsPerSecond);
    this.#slow.sample(durationSeconds, bitsPerSecond);
  }

  /** Pessimistic estimate in bits/sec; 0 until `canEstimate()`. */
  getEstimate(): number {
    if (!this.canEstimate()) {
      return 0;
    }
    return Math.min(this.#fast.getEstimate(), this.#slow.getEstimate());
  }

  canEstimate(): boolean {
    return this.#slow.getTotalWeight() >= MIN_TOTAL_WEIGHT;
  }
}
