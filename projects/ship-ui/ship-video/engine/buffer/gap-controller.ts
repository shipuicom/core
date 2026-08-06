import { TimeRangesLike, forwardBufferLength } from './source-buffer-like';

export type GapControllerCallbacks = {
  onStallStart(): void;
  onStallRecovered(): void;
  /** Asks the owner to nudge `media.currentTime` forward; the controller never writes it. */
  onNudge(seconds: number): void;
  onGiveUp(): void;
};

export type MediaLike = {
  currentTime: number;
  paused: boolean;
  seeking: boolean;
  readyState: number;
  buffered: TimeRangesLike;
};

export type GapControllerConfig = {
  /** Frozen-time span before a stall is declared. Default 500. */
  stallThresholdMs?: number;
  /** Nudges attempted before `onGiveUp`. Default 3. */
  maxNudges?: number;
  /** Seconds per nudge. Default 0.1. */
  nudgeSeconds?: number;
};

/** Forward buffer below which a stall counts as starvation rather than a gap. */
const STARVATION_THRESHOLD = 0.1;

/**
 * Detects a frozen `currentTime` while playback should progress. With data
 * buffered ahead it escalates stall -> nudge (x maxNudges) -> give-up; with
 * nothing ahead it only reports the stall (starvation is the ABR's problem).
 * Timer-free: the owner calls `tick(nowMs)` on its own cadence.
 */
export class GapController {
  #media: MediaLike;
  #callbacks: GapControllerCallbacks;
  #stallThresholdMs: number;
  #maxNudges: number;
  #nudgeSeconds: number;

  #lastTime: number | null = null;
  #lastChangeAtMs = 0;
  #stalled = false;
  #nudges = 0;
  #gaveUp = false;

  constructor(media: MediaLike, callbacks: GapControllerCallbacks, config?: GapControllerConfig) {
    this.#media = media;
    this.#callbacks = callbacks;
    this.#stallThresholdMs = config?.stallThresholdMs ?? 500;
    this.#maxNudges = config?.maxNudges ?? 3;
    this.#nudgeSeconds = config?.nudgeSeconds ?? 0.1;
  }

  /** Call on an interval/rVFC with a monotonic timestamp in milliseconds. */
  tick(nowMs: number): void {
    const media = this.#media;
    if (media.paused || media.seeking || media.readyState < 2) {
      this.#lastTime = media.currentTime;
      this.#lastChangeAtMs = nowMs;
      return;
    }
    const time = media.currentTime;
    if (this.#lastTime === null) {
      this.#lastTime = time;
      this.#lastChangeAtMs = nowMs;
      return;
    }
    if (time !== this.#lastTime) {
      this.#lastTime = time;
      this.#lastChangeAtMs = nowMs;
      if (this.#stalled) {
        this.#stalled = false;
        this.#nudges = 0;
        this.#gaveUp = false;
        this.#callbacks.onStallRecovered();
      }
      return;
    }
    if (nowMs - this.#lastChangeAtMs < this.#stallThresholdMs) {
      return;
    }
    if (!this.#stalled) {
      this.#stalled = true;
      this.#callbacks.onStallStart();
    }
    if (forwardBufferLength(media.buffered, time) <= STARVATION_THRESHOLD) {
      // Starving: no nudges, no give-up.
      return;
    }
    if (this.#gaveUp) {
      return;
    }
    if (this.#nudges >= this.#maxNudges) {
      this.#gaveUp = true;
      this.#callbacks.onGiveUp();
      return;
    }
    this.#nudges++;
    this.#lastChangeAtMs = nowMs;
    this.#callbacks.onNudge(this.#nudgeSeconds);
    // The callback may have written currentTime; a nudge itself is not recovery.
    this.#lastTime = media.currentTime;
  }

  /** Clear all stall state. Call on seek, pause and level switches. */
  reset(): void {
    this.#lastTime = null;
    this.#lastChangeAtMs = 0;
    this.#stalled = false;
    this.#nudges = 0;
    this.#gaveUp = false;
  }
}
