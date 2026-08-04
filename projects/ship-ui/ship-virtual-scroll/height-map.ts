/**
 * Pixel-height model for viewport virtualization: one entry per top-level
 * block, measured heights where the DOM has told us, a rolling-average
 * estimate everywhere else.
 *
 * The mapping the window needs — scroll offset → block index, block index →
 * pixel offset — runs off a lazily rebuilt prefix-sum array. A rebuild is
 * O(blocks) over a Float64Array (~60µs at 60k), which is cheaper than keeping
 * a Fenwick correct across the estimate drifting: every measurement that
 * moves the rolling average changes the effective height of *all* unmeasured
 * blocks at once, and a prefix rebuild absorbs that for free.
 *
 * Heights here are "distance to the next block's top": the measurement pass
 * feeds offsetTop deltas, so inter-block margins (including collapse) are
 * inside the numbers and the prefix sums match real layout.
 */
/**
 * The rolling average locks after this many measurements. Every average move
 * re-prices *all* unmeasured blocks at once, which moves the spacer padding,
 * which shifts content under a fixed scrollTop, which moves the window, which
 * measures new blocks and moves the average again — an oscillation that in
 * practice unmounted the caret's block mid-typing. A locked estimate makes
 * the pixel model deterministic once a windowful of blocks has been seen.
 */
const ESTIMATE_LOCK_AFTER = 32;

export class BlockHeightMap {
  #heights: Float64Array;
  #measured: Uint8Array;
  #count: number;
  #measuredCount = 0;
  #measuredSum = 0;
  #defaultEstimate: number;
  #lockedEstimate: number | null = null;
  #prefix: Float64Array | null = null;

  constructor(count: number, defaultEstimate = 36) {
    this.#count = count;
    this.#defaultEstimate = defaultEstimate;
    this.#heights = new Float64Array(count);
    this.#measured = new Uint8Array(count);
  }

  get count(): number {
    return this.#count;
  }

  /** Height assumed for a block the DOM has never laid out. */
  get estimate(): number {
    if (this.#lockedEstimate !== null) return this.#lockedEstimate;
    return this.#measuredCount > 0 ? this.#measuredSum / this.#measuredCount : this.#defaultEstimate;
  }

  heightOf(index: number): number {
    return this.#measured[index] ? this.#heights[index] : this.estimate;
  }

  isMeasured(index: number): boolean {
    return this.#measured[index] === 1;
  }

  /** Record a real height. Reports whether anything actually changed. */
  measure(index: number, height: number): boolean {
    if (index < 0 || index >= this.#count || !(height >= 0)) return false;
    if (this.#measured[index]) {
      if (Math.abs(this.#heights[index] - height) < 0.5) return false;
      this.#measuredSum += height - this.#heights[index];
    } else {
      this.#measured[index] = 1;
      this.#measuredCount++;
      this.#measuredSum += height;
      if (this.#lockedEstimate === null && this.#measuredCount >= ESTIMATE_LOCK_AFTER) {
        this.#lockedEstimate = this.#measuredSum / this.#measuredCount;
      }
    }
    this.#heights[index] = height;
    this.#prefix = null;
    return true;
  }

  /** Mirror a structural edit: `remove` blocks at `at` replaced by `insert` unmeasured ones. */
  splice(at: number, remove: number, insert: number): void {
    const actualRemove = Math.max(0, Math.min(remove, this.#count - at));
    const newCount = this.#count - actualRemove + insert;
    const heights = new Float64Array(newCount);
    const measured = new Uint8Array(newCount);

    heights.set(this.#heights.subarray(0, at));
    measured.set(this.#measured.subarray(0, at));
    heights.set(this.#heights.subarray(at + actualRemove, this.#count), at + insert);
    measured.set(this.#measured.subarray(at + actualRemove, this.#count), at + insert);

    for (let i = at; i < at + actualRemove; i++) {
      if (this.#measured[i]) {
        this.#measuredCount--;
        this.#measuredSum -= this.#heights[i];
      }
    }

    this.#heights = heights;
    this.#measured = measured;
    this.#count = newCount;
    this.#prefix = null;
  }

  /** Sum of heights of blocks [0, index). */
  prefixHeight(index: number): number {
    const prefix = this.#ensurePrefix();
    const i = Math.max(0, Math.min(index, this.#count));
    return prefix[i];
  }

  total(): number {
    return this.prefixHeight(this.#count);
  }

  /** The block whose vertical span contains pixel offset `y`, clamped to valid indices. */
  indexAt(y: number): number {
    if (this.#count === 0) return 0;
    const prefix = this.#ensurePrefix();
    if (y <= 0) return 0;
    if (y >= prefix[this.#count]) return this.#count - 1;
    // Largest i with prefix[i] <= y.
    let lo = 0;
    let hi = this.#count - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (prefix[mid] <= y) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  #ensurePrefix(): Float64Array {
    if (this.#prefix) return this.#prefix;
    const prefix = new Float64Array(this.#count + 1);
    const estimate = this.estimate;
    for (let i = 0; i < this.#count; i++) {
      prefix[i + 1] = prefix[i] + (this.#measured[i] ? this.#heights[i] : estimate);
    }
    this.#prefix = prefix;
    return prefix;
  }
}
