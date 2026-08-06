/**
 * Pure buffer policy: back-buffer eviction, forward-buffer load gating and
 * quota-exceeded backoff. No MSE access — callers apply decisions through the
 * `SourceBufferQueue`.
 */

export type EvictionRange = { start: number; end: number };

/** Seconds directly behind the playhead that eviction must never touch. */
const MIN_KEEP_BEHIND = 10;

/** Back buffer kept after a quota-exceeded eviction. */
const QUOTA_EVICT_BEHIND = 10;

/** Quota-exceeded retries allowed per append before giving up. */
const QUOTA_MAX_RETRIES = 2;

/**
 * Range to remove behind the playhead, or `null` when the back buffer is
 * within `backBufferLength`. Never removes within 10s behind the playhead.
 */
export function computeEviction(args: {
  buffered: Array<{ start: number; end: number }>;
  currentTime: number;
  backBufferLength: number;
}): EvictionRange | null {
  const { buffered, currentTime, backBufferLength } = args;
  const evictEnd = currentTime - Math.max(backBufferLength, MIN_KEEP_BEHIND);
  if (evictEnd <= 0) {
    return null;
  }
  let earliestStart = Infinity;
  for (const range of buffered) {
    if (range.start < evictEnd) {
      earliestStart = Math.min(earliestStart, range.start);
    }
  }
  if (earliestStart === Infinity) {
    return null;
  }
  return { start: earliestStart, end: evictEnd };
}

/** Whether the forward buffer has room for another segment. */
export function shouldLoadMore(args: { forwardBufferSeconds: number; maxForwardBuffer: number }): boolean {
  return args.forwardBufferSeconds < args.maxForwardBuffer;
}

/**
 * Shrinks the forward-buffer target after `QuotaExceededError` and bounds
 * retries. The shrunken window persists for the session; only the per-append
 * retry counter resets on a successful append.
 */
export class QuotaBackoff {
  #maxForwardBuffer: number;
  #floorSeconds: number;
  #retries = 0;

  constructor(initialMaxForwardBuffer: number, floorSeconds = 15) {
    this.#maxForwardBuffer = initialMaxForwardBuffer;
    this.#floorSeconds = floorSeconds;
  }

  get maxForwardBuffer(): number {
    return this.#maxForwardBuffer;
  }

  /**
   * Halves the forward-buffer target (not below the floor). Returns the back
   * buffer to keep after eviction and whether the append should be retried.
   */
  onQuotaExceeded(): { evictBehind: number; retry: boolean } {
    this.#maxForwardBuffer = Math.max(this.#floorSeconds, this.#maxForwardBuffer / 2);
    this.#retries++;
    return { evictBehind: QUOTA_EVICT_BEHIND, retry: this.#retries <= QUOTA_MAX_RETRIES };
  }

  /** Successful append: resets the per-append retry counter, keeps the shrunken window. */
  reset(): void {
    this.#retries = 0;
  }
}
