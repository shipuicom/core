/**
 * Framework-free types for the ship-video streaming engine.
 * Nothing in engine/ may import from @angular/*.
 */

export type ShipVideoEngineKind = 'mse-hls' | 'native-hls' | 'progressive';

export type ShipVideoQualityLevel = {
  /** Index in multivariant playlist order; also the id passed to `setLevel`. */
  id: number;
  width?: number;
  height?: number;
  /** BANDWIDTH attribute (bits/sec). */
  bitrate: number;
  codecs?: string;
  frameRate?: number;
  /** Display label, e.g. `1080p` (derived from height) or the variant NAME. */
  label: string;
};

export type ShipVideoAudioTrack = {
  id: number;
  groupId: string;
  name: string;
  lang?: string;
  channels?: string;
  default: boolean;
};

export type ShipVideoSubtitleTrack = {
  id: number;
  groupId: string;
  name: string;
  lang?: string;
  forced: boolean;
  default: boolean;
};

export type ShipVideoStoryboardCue = {
  start: number;
  end: number;
  url: string;
  /** Sprite region; absent for single-image cues. */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export type ShipVideoEngineErrorType = 'network' | 'media' | 'mux' | 'other';

export type ShipVideoEngineErrorCode =
  | 'manifest-load'
  | 'manifest-parse'
  | 'segment-load'
  | 'append'
  | 'quota'
  | 'stall'
  | 'unsupported'
  | 'drm-unsupported';

export type ShipVideoEngineError = {
  fatal: boolean;
  type: ShipVideoEngineErrorType;
  code: ShipVideoEngineErrorCode;
  detail?: string;
  cause?: unknown;
};

export type ShipVideoDvrWindow = { start: number; end: number };

export type ShipVideoEngineState = {
  readonly kind: ShipVideoEngineKind;
  readonly levels: readonly ShipVideoQualityLevel[];
  /** Level currently playing; -1 before the first segment. */
  readonly currentLevel: number;
  /** Level currently being fetched (differs from currentLevel mid-switch). */
  readonly loadingLevel: number;
  readonly autoLevel: boolean;
  readonly audioTracks: readonly ShipVideoAudioTrack[];
  readonly currentAudioTrack: number;
  readonly subtitleTracks: readonly ShipVideoSubtitleTrack[];
  /** -1 = off. */
  readonly currentSubtitleTrack: number;
  readonly isLive: boolean;
  /** Media time of the live edge, `null` for VOD. */
  readonly liveEdge: number | null;
  readonly dvrWindow: ShipVideoDvrWindow | null;
  /** Seconds behind the live edge, `null` for VOD. */
  readonly latency: number | null;
  readonly atLiveEdge: boolean;
  /** Slow-EWMA bandwidth estimate in bits/sec; 0 until measurable. */
  readonly bandwidthEstimate: number;
  /** Seconds buffered ahead of currentTime. */
  readonly forwardBufferLength: number;
  readonly stalled: boolean;
  readonly storyboard: readonly ShipVideoStoryboardCue[] | null;
  /** Last fatal error, if any. */
  readonly error: ShipVideoEngineError | null;
};

export type ShipVideoEngineEvent =
  | { type: 'manifest-parsed' }
  | { type: 'level-switched'; level: number }
  | { type: 'error'; error: ShipVideoEngineError }
  | { type: 'ended' };

export type ShipVideoAbrConfig = {
  /** Half-life (seconds) of the fast throughput EWMA. Default 3. */
  fastHalfLife: number;
  /** Half-life (seconds) of the slow throughput EWMA. Default 9. */
  slowHalfLife: number;
  /** Fraction of the estimate a level must fit under to up-switch. Default 0.75. */
  safetyFactor: number;
  /** Minimum forward buffer (seconds) before up-switching. Default 10. */
  upSwitchMinBuffer: number;
  /** Forward buffer (seconds) under which emergency down-switching engages. Default 5. */
  downSwitchMaxBuffer: number;
  /** Minimum seconds between up-switches (hysteresis). Default 5. */
  upSwitchHoldTime: number;
};

export type ShipVideoEngineConfig = {
  /** Max seconds buffered ahead of playhead. Default 60 (30 when live). */
  maxForwardBuffer?: number;
  /** Seconds kept behind the playhead before eviction. Default 30. */
  backBufferLength?: number;
  /** Live-edge distance target in target-durations. Default 3. */
  liveEdgeOffsetTargets?: number;
  abr?: Partial<ShipVideoAbrConfig>;
  /** Injectable fetch for tests. */
  fetchFn?: typeof fetch;
};

export const SHIP_VIDEO_DEFAULT_ABR: ShipVideoAbrConfig = {
  fastHalfLife: 3,
  slowHalfLife: 9,
  safetyFactor: 0.75,
  upSwitchMinBuffer: 10,
  downSwitchMaxBuffer: 5,
  upSwitchHoldTime: 5,
};

export interface ShipVideoEngine {
  /** Attach the media element and begin loading. Call once per instance. */
  load(video: HTMLVideoElement, src: string): void;
  /** Detach, abort in-flight work, release MediaSource. */
  destroy(): void;

  /** Current immutable snapshot (object identity changes on every update). */
  getState(): ShipVideoEngineState;
  subscribe(listener: (state: ShipVideoEngineState) => void): () => void;
  on(listener: (event: ShipVideoEngineEvent) => void): () => void;

  /** -1 = auto. */
  setLevel(level: number): void;
  setAudioTrack(id: number): void;
  /** -1 = off. */
  setSubtitleTrack(id: number): void;
  seekToLiveEdge(): void;
  /** Page Visibility / IntersectionObserver hint. */
  setVisibility(visible: boolean): void;
}
