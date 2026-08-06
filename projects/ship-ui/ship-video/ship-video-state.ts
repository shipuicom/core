import { Injectable, signal } from '@angular/core';
import {
  ShipVideoAudioTrack,
  ShipVideoDvrWindow,
  ShipVideoQualityLevel,
  ShipVideoStoryboardCue,
  ShipVideoSubtitleTrack,
} from './engine/types';
import { ShipVideoAdCreative, ShipVideoMarker, ShipVideoTimeRange } from './ship-video-types';

/**
 * Imperative surface a bound player registers on the store. Everything that is
 * a command rather than state delegates here; the store itself stays passive.
 */
export interface ShipVideoPlayerHooks {
  start(): void;
  seekTo(seconds: number, options?: { precise?: boolean }): void;
  step(frames: number): void;
  onVideoFrame(callback: (time: number) => void): () => void;
  goToLive(): void;
  skipAd(): void;
  toggleFullscreen(): void;
  togglePip(): void;
  requestCast(): void;
  requestAirplay(): void;
  mediaElement(): HTMLVideoElement | null;
}

/**
 * Centralized player state. Provided by `sh-video` by default; provide it on a
 * wrapper (e.g. a video editor shell) to share one store between the wrapper,
 * the projected player and every control:
 *
 * ```ts
 * @Component({ selector: 'sh-video-editor', providers: [ShipVideoState] })
 * ```
 *
 * Writable signals are the API: `playing.set(true)` plays, `currentTime.set(12)`
 * seeks, `quality.set(2)` switches level. Controls and future editors read and
 * write the same signals the markup bindings use.
 */
@Injectable()
export class ShipVideoState {
  #hooks: ShipVideoPlayerHooks | null = null;

  // -- writable (two-way) --------------------------------------------------
  /** Set to play/pause; reflects actual media playback state. */
  readonly playing = signal(false);
  /** Set to seek (content video); reflects playback position while playing. */
  readonly currentTime = signal(0);
  /** Volume `0..1`. */
  readonly volume = signal(1);
  readonly muted = signal(false);
  readonly playbackRate = signal(1);
  /** `'auto'` or a level id from `levels()`. */
  readonly quality = signal<'auto' | number>('auto');
  /** Subtitle track id from `subtitleTracks()`, `null` = off. */
  readonly textTrack = signal<number | null>(null);
  /** Audio track/rendition id, `null` = default. */
  readonly audioTrack = signal<number | null>(null);

  // -- observed (player/engine-written) ------------------------------------
  readonly mediaElementSignal = signal<HTMLVideoElement | null>(null);
  readonly hasStarted = signal(false);
  readonly duration = signal(0);
  readonly bufferedRanges = signal<ShipVideoTimeRange[]>([]);
  readonly seeking = signal(false);
  readonly stalled = signal(false);
  readonly isFullscreen = signal(false);
  readonly isPip = signal(false);
  readonly interactive = signal(true);
  readonly controlsVisible = signal(true);

  // remote playback (Chromecast via Remote Playback API / AirPlay)
  readonly castAvailable = signal(false);
  readonly airplayAvailable = signal(false);
  readonly casting = signal(false);

  // ads
  readonly adActive = signal(false);
  readonly adCreative = signal<ShipVideoAdCreative | null>(null);
  readonly adCurrentTime = signal(0);
  readonly adDuration = signal(0);

  // quality / tracks
  readonly levels = signal<readonly ShipVideoQualityLevel[]>([]);
  readonly activeLevel = signal(-1);
  readonly subtitleTracks = signal<readonly ShipVideoSubtitleTrack[]>([]);
  readonly audioTracks = signal<readonly ShipVideoAudioTrack[]>([]);
  readonly playbackRates = signal<number[]>([0.5, 1, 1.25, 1.5, 2]);

  // live
  readonly isLive = signal(false);
  readonly atLiveEdge = signal(false);
  readonly dvrWindow = signal<ShipVideoDvrWindow | null>(null);
  readonly latency = signal<number | null>(null);

  // scrubber extras
  readonly storyboard = signal<readonly ShipVideoStoryboardCue[] | null>(null);
  readonly markers = signal<ShipVideoMarker[]>([]);

  // -- commands ------------------------------------------------------------
  /** Registers the player that executes commands. Called by `sh-video`. */
  attachPlayer(hooks: ShipVideoPlayerHooks) {
    this.#hooks = hooks;
  }

  detachPlayer(hooks: ShipVideoPlayerHooks) {
    if (this.#hooks === hooks) this.#hooks = null;
  }

  /** Starts playback for the first time (runs the pre-roll ad when configured). */
  start() {
    this.#hooks?.start();
  }

  togglePlay() {
    if (!this.hasStarted()) {
      this.start();
      return;
    }
    this.playing.set(!this.playing());
  }

  toggleMute() {
    this.muted.set(!this.muted());
  }

  seekTo(seconds: number, options?: { precise?: boolean }) {
    this.#hooks?.seekTo(seconds, options);
  }

  /** Frame stepping (pauses playback); frame duration derived from rVFC deltas. */
  step(frames: number) {
    this.#hooks?.step(frames);
  }

  /** `requestVideoFrameCallback` passthrough; returns an unsubscribe function. */
  onVideoFrame(callback: (time: number) => void): () => void {
    return this.#hooks?.onVideoFrame(callback) ?? (() => {});
  }

  goToLive() {
    this.#hooks?.goToLive();
  }

  skipAd() {
    this.#hooks?.skipAd();
  }

  toggleFullscreen() {
    this.#hooks?.toggleFullscreen();
  }

  togglePip() {
    this.#hooks?.togglePip();
  }

  /** Opens the Chromecast/remote-playback device picker (Remote Playback API). */
  requestCast() {
    this.#hooks?.requestCast();
  }

  /** Opens Safari's AirPlay target picker. */
  requestAirplay() {
    this.#hooks?.requestAirplay();
  }

  /** The underlying `<video>` element (canvas capture, filmstrips); `null` on SSR. */
  mediaElement(): HTMLVideoElement | null {
    return this.#hooks?.mediaElement() ?? null;
  }
}
