/**
 * Time-weighted exponentially-weighted moving average with zero-bias
 * correction, as used by the hls.js/shaka bandwidth estimators.
 *
 * Each sample carries a weight in seconds; the configured half-life is the
 * weight after which a sample's influence has decayed to 50%.
 */
export class Ewma {
  /** Per-second decay factor: 0.5^(1 / halfLife). */
  #alpha: number;
  #estimate = 0;
  #totalWeight = 0;

  constructor(halfLifeSeconds: number) {
    if (!(halfLifeSeconds > 0)) {
      throw new RangeError(`Ewma half-life must be > 0, got ${halfLifeSeconds}`);
    }
    this.#alpha = Math.exp(Math.log(0.5) / halfLifeSeconds);
  }

  sample(weightSeconds: number, value: number): void {
    if (!(weightSeconds > 0) || !Number.isFinite(value)) {
      return;
    }
    const adjAlpha = Math.pow(this.#alpha, weightSeconds);
    this.#estimate = adjAlpha * this.#estimate + (1 - adjAlpha) * value;
    this.#totalWeight += weightSeconds;
  }

  /** Bias-corrected estimate; 0 until the first sample. */
  getEstimate(): number {
    if (this.#totalWeight === 0) {
      return 0;
    }
    const zeroFactor = 1 - Math.pow(this.#alpha, this.#totalWeight);
    return this.#estimate / zeroFactor;
  }

  getTotalWeight(): number {
    return this.#totalWeight;
  }
}
