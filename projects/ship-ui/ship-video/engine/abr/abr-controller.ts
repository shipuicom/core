import type { ShipVideoAbrConfig } from '../types';

export type AbrDecisionArgs = {
  /** Variant bitrates (bits/sec) ordered by level id, lowest first. */
  levelBitrates: number[];
  /** Level currently playing; -1 if none yet. */
  currentLevel: number;
  /** Throughput estimate in bits/sec; 0 = unknown. */
  bandwidthEstimate: number;
  /** Seconds buffered ahead of the playhead. */
  forwardBufferSeconds: number;
  /** Seconds since the last level switch (hysteresis input). */
  secondsSinceLastSwitch: number;
  config: ShipVideoAbrConfig;
};

/** Highest index in `bitrates` whose bitrate fits under `budget`; -1 if none. */
function highestLevelUnder(bitrates: number[], budget: number): number {
  for (let i = bitrates.length - 1; i >= 0; i--) {
    if (bitrates[i] <= budget) {
      return i;
    }
  }
  return -1;
}

/**
 * Pure ABR decision function. Rules, evaluated in order:
 *
 * 1. No estimate: keep the current level, or start at the lowest.
 * 2. Emergency down: buffer under `downSwitchMaxBuffer` while the current
 *    level exceeds the estimate drops straight to what the estimate affords.
 * 3. Up-switches require a healthy buffer (`upSwitchMinBuffer`) and respect
 *    the hold time (`upSwitchHoldTime`); the candidate must also fit under
 *    `estimate * safetyFactor`.
 * 4. Down-switches are never delayed.
 */
export function selectLevel(args: AbrDecisionArgs): number {
  const { levelBitrates, currentLevel, bandwidthEstimate, forwardBufferSeconds, secondsSinceLastSwitch, config } = args;
  const maxLevel = levelBitrates.length - 1;
  if (maxLevel < 0) {
    return -1;
  }
  const clamp = (level: number): number => Math.min(maxLevel, Math.max(0, level));

  if (bandwidthEstimate <= 0) {
    return currentLevel >= 0 ? clamp(currentLevel) : 0;
  }

  if (
    forwardBufferSeconds < config.downSwitchMaxBuffer &&
    currentLevel >= 0 &&
    levelBitrates[currentLevel] > bandwidthEstimate
  ) {
    return clamp(highestLevelUnder(levelBitrates, bandwidthEstimate));
  }

  const candidate = highestLevelUnder(levelBitrates, bandwidthEstimate * config.safetyFactor);

  if (candidate > currentLevel) {
    const canUpSwitch =
      forwardBufferSeconds >= config.upSwitchMinBuffer && secondsSinceLastSwitch >= config.upSwitchHoldTime;
    return clamp(canUpSwitch ? candidate : currentLevel);
  }

  return clamp(candidate);
}

/**
 * Stateful wrapper around `selectLevel`: tracks the active level, switch
 * timing for hysteresis, and a manual override (-1 = auto).
 */
export class AbrController {
  #config: ShipVideoAbrConfig;
  #now: () => number;
  #levelBitrates: number[] = [];
  #manualLevel = -1;
  #currentLevel = -1;
  #lastSwitchTime = -Infinity;

  constructor(config: ShipVideoAbrConfig, now?: () => number) {
    this.#config = config;
    this.#now = now ?? (typeof performance !== 'undefined' ? () => performance.now() : () => Date.now());
  }

  setLevels(bitrates: number[]): void {
    this.#levelBitrates = bitrates.slice();
  }

  /** -1 returns to auto. */
  setManualLevel(level: number): void {
    this.#manualLevel = level;
  }

  get manualLevel(): number {
    return this.#manualLevel;
  }

  get autoLevel(): boolean {
    return this.#manualLevel === -1;
  }

  /**
   * Decide the level for the next segment request. Applies the manual
   * override when set, otherwise runs `selectLevel`; records the switch
   * time whenever the result differs from the previous decision.
   */
  nextLevel(bandwidthEstimate: number, forwardBufferSeconds: number): number {
    const maxLevel = this.#levelBitrates.length - 1;
    if (maxLevel < 0) {
      return -1;
    }

    let level: number;
    if (this.#manualLevel >= 0) {
      level = Math.min(maxLevel, this.#manualLevel);
    } else {
      level = selectLevel({
        levelBitrates: this.#levelBitrates,
        currentLevel: this.#currentLevel,
        bandwidthEstimate,
        forwardBufferSeconds,
        secondsSinceLastSwitch: (this.#now() - this.#lastSwitchTime) / 1000,
        config: this.#config,
      });
    }

    if (level !== this.#currentLevel) {
      this.#lastSwitchTime = this.#now();
      this.#currentLevel = level;
    }
    return level;
  }

  /**
   * Whether an in-flight segment download should be aborted in favour of a
   * lower level: buffer is critical and the projected time to finish the
   * download exceeds what is left in the buffer.
   */
  shouldAbortInflight(args: {
    inflightLevelBitrate: number;
    bandwidthEstimate: number;
    forwardBufferSeconds: number;
    remainingBytes: number;
  }): boolean {
    const { bandwidthEstimate, forwardBufferSeconds, remainingBytes } = args;
    if (bandwidthEstimate <= 0) {
      return false;
    }
    if (forwardBufferSeconds >= this.#config.downSwitchMaxBuffer) {
      return false;
    }
    const projectedRemainingSeconds = (remainingBytes * 8) / bandwidthEstimate;
    return projectedRemainingSeconds > forwardBufferSeconds;
  }
}
