import { AbrController } from './abr/abr-controller';
import { BandwidthEstimator } from './abr/bandwidth-estimator';
import { computeEviction, QuotaBackoff, shouldLoadMore } from './buffer/buffer-controller';
import { GapController } from './buffer/gap-controller';
import { bufferedToRanges, forwardBufferLength, SourceBufferLike, TimeRangesLike } from './buffer/source-buffer-like';
import { SourceBufferQueue } from './buffer/source-buffer-queue';
import { getMediaSourceCtor } from './capabilities';
import { EngineStore } from './engine-store';
import { computeLiveInfo } from './hls/live-tracker';
import {
  HlsMediaPlaylist,
  HlsMultivariantPlaylist,
  HlsRendition,
  HlsSegment,
  HlsVariant,
  parseM3u8,
} from './hls/m3u8-parser';
import { nextReloadDelay } from './hls/reload-timing';
import type { TsTransmuxer } from './transmux/ts-transmuxer';

// structural view of TsTransmuxer: the lazy entry point resolves to its own
// module identity at build time, and private fields would break nominal compat
type TransmuxerLike = Pick<TsTransmuxer, 'transmux' | 'reset'>;
import {
  SHIP_VIDEO_DEFAULT_ABR,
  ShipVideoAudioTrack,
  ShipVideoEngine,
  ShipVideoEngineConfig,
  ShipVideoEngineError,
  ShipVideoEngineEvent,
  ShipVideoEngineState,
  ShipVideoQualityLevel,
} from './types';

const TICK_INTERVAL = 250;
const MAX_SEGMENT_RETRIES = 3;
const MAX_RELOAD_ERRORS = 6;
const VIDEO_CODEC_PREFIXES = ['avc1', 'avc3', 'hvc1', 'hev1', 'av01', 'vp09', 'vp8', 'vp9'];

function variantLabel(variant: HlsVariant, index: number): string {
  if (variant.height) return `${variant.height}p`;
  if (variant.name) return variant.name;
  return `Level ${index + 1}`;
}

function splitCodecs(codecs: string | undefined): { video?: string; audio?: string } {
  if (!codecs) return {};

  const parts = codecs.split(',').map((part) => part.trim());
  const video = parts.find((part) => VIDEO_CODEC_PREFIXES.some((prefix) => part.startsWith(prefix)));
  const audio = parts.find((part) => part !== video);
  return { video, audio };
}

type StreamTrack = {
  kind: 'video' | 'audio';
  queue: SourceBufferQueue | null;
  sourceBuffer: SourceBufferLike | null;
  playlist: HlsMediaPlaylist | null;
  uri: string;
  nextSn: number;
  appendedInitUri: string | null;
  loading: boolean;
  loadingSegment: boolean;
  retries: number;
  done: boolean;
};

/**
 * In-house MSE HLS engine: fMP4/CMAF, VOD + live, ABR, muxed or demuxed
 * (separate EXT-X-MEDIA audio renditions). Subtitle playlists land in a later
 * phase.
 */
export class HlsEngine implements ShipVideoEngine {
  #store = new EngineStore('mse-hls');
  #config: Required<Pick<ShipVideoEngineConfig, 'maxForwardBuffer' | 'backBufferLength' | 'liveEdgeOffsetTargets'>>;
  #abrConfig = SHIP_VIDEO_DEFAULT_ABR;
  #fetchFn: typeof fetch;

  #video: HTMLVideoElement | null = null;
  #src = '';
  #mediaSource: MediaSource | null = null;
  #objectUrl = '';
  #estimator: BandwidthEstimator;
  #abr: AbrController;
  #quota: QuotaBackoff;
  #gap: GapController | null = null;

  #multivariant: HlsMultivariantPlaylist | null = null;
  #levelPlaylists = new Map<number, HlsMediaPlaylist>();
  /** Absolute media time of the current video playlist's first segment. */
  #playlistStartTime = 0;
  /** Offset between playlist time and the media element's timeline (tfdt anchor). */
  #mediaTimeOffset: number | null = null;
  #initCache = new Map<string, ArrayBuffer>();

  #videoTrack: StreamTrack = this.#emptyTrack('video');
  #audioTrack: StreamTrack | null = null;
  /** Level ids sorted by bitrate ascending — the ABR controller's index space. */
  #sortedLevelIds: number[] = [0];

  // legacy MPEG-TS segments: transmuxed to fMP4 via the lazily loaded wasm module
  #tsMode = false;
  #transmuxer: TransmuxerLike | null = null;
  #lastTsCc = -1;
  #audioRenditions: HlsRendition[] = [];
  #currentAudioRendition = -1;

  #loadingLevel = -1;
  #inflight = new Set<AbortController>();
  #tickTimer: ReturnType<typeof setInterval> | null = null;
  #reloadTimer: ReturnType<typeof setTimeout> | null = null;
  #reloadErrorCount = 0;
  #ticking = false;
  #endedSignalled = false;
  #visible = true;
  #playbackStarted = false;
  #destroyed = false;

  constructor(config?: ShipVideoEngineConfig) {
    this.#config = {
      maxForwardBuffer: config?.maxForwardBuffer ?? 60,
      backBufferLength: config?.backBufferLength ?? 30,
      liveEdgeOffsetTargets: config?.liveEdgeOffsetTargets ?? 3,
    };
    this.#abrConfig = { ...SHIP_VIDEO_DEFAULT_ABR, ...config?.abr };
    this.#fetchFn = config?.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    this.#estimator = new BandwidthEstimator({
      fastHalfLife: this.#abrConfig.fastHalfLife,
      slowHalfLife: this.#abrConfig.slowHalfLife,
    });
    this.#abr = new AbrController(this.#abrConfig);
    this.#quota = new QuotaBackoff(this.#config.maxForwardBuffer);
  }

  load(video: HTMLVideoElement, src: string) {
    this.#video = video;
    this.#src = src;

    const MediaSourceCtor = getMediaSourceCtor();
    if (!MediaSourceCtor) {
      this.#fail({ fatal: true, type: 'other', code: 'unsupported', detail: 'MediaSource is not available' });
      return;
    }

    // ManagedMediaSource (iPadOS/iOS fallback path) refuses to open unless
    // remote playback is explicitly disabled or an AirPlay alternative exists
    if (MediaSourceCtor.name === 'ManagedMediaSource') {
      (video as HTMLVideoElement & { disableRemotePlayback?: boolean }).disableRemotePlayback = true;
    }

    this.#mediaSource = new MediaSourceCtor();
    this.#objectUrl = URL.createObjectURL(this.#mediaSource);
    this.#mediaSource.addEventListener('sourceopen', this.#onSourceOpen, { once: true });
    video.addEventListener('seeking', this.#onSeeking);
    video.addEventListener('ended', this.#onEnded);
    video.addEventListener('play', this.#onPlay);
    video.src = this.#objectUrl;
  }

  destroy() {
    this.#destroyed = true;
    if (this.#tickTimer) clearInterval(this.#tickTimer);
    if (this.#reloadTimer) clearTimeout(this.#reloadTimer);
    for (const controller of this.#inflight) controller.abort();
    this.#inflight.clear();
    this.#videoTrack.queue?.destroy();
    this.#audioTrack?.queue?.destroy();

    if (this.#video) {
      this.#video.removeEventListener('seeking', this.#onSeeking);
      this.#video.removeEventListener('ended', this.#onEnded);
      this.#video.removeEventListener('play', this.#onPlay);
      this.#video.removeAttribute('src');
    }
    if (this.#objectUrl) URL.revokeObjectURL(this.#objectUrl);

    this.#video = null;
    this.#mediaSource = null;
    this.#store.clear();
  }

  getState(): ShipVideoEngineState {
    return this.#store.getState();
  }

  subscribe(listener: (state: ShipVideoEngineState) => void): () => void {
    return this.#store.subscribe(listener);
  }

  on(listener: (event: ShipVideoEngineEvent) => void): () => void {
    return this.#store.on(listener);
  }

  setLevel(level: number) {
    this.#abr.setManualLevel(level === -1 ? -1 : this.#sortedLevelIds.indexOf(level));
    this.#store.patch({ autoLevel: level === -1 });
  }

  setAudioTrack(id: number) {
    const rendition = this.#audioRenditions[id];
    if (!rendition?.uri || id === this.#currentAudioRendition || !this.#audioTrack) return;

    this.#currentAudioRendition = id;
    this.#store.patch({ currentAudioTrack: id });

    // flush the audio buffer and restart that track from the playhead
    const track = this.#audioTrack;
    track.uri = rendition.uri;
    track.playlist = null;
    track.appendedInitUri = null;
    track.done = false;
    const buffered = track.sourceBuffer ? bufferedToRanges(track.sourceBuffer.buffered) : [];
    if (buffered.length && track.queue) {
      track.queue.remove(buffered[0].start, buffered[buffered.length - 1].end).catch(() => {});
    }
  }

  setSubtitleTrack(_id: number) {
    // later phase: WebVTT subtitle playlists → TextTracks
  }

  seekToLiveEdge() {
    const { liveEdge } = this.#store.getState();
    if (this.#video && liveEdge !== null) {
      this.#video.currentTime = liveEdge;
    }
  }

  setVisibility(visible: boolean) {
    this.#visible = visible;
  }

  // -- setup -----------------------------------------------------------------

  #emptyTrack(kind: 'video' | 'audio'): StreamTrack {
    return {
      kind,
      queue: null,
      sourceBuffer: null,
      playlist: null,
      uri: '',
      nextSn: -1,
      appendedInitUri: null,
      loading: false,
      loadingSegment: false,
      retries: 0,
      done: false,
    };
  }

  #onSourceOpen = async () => {
    try {
      const manifestText = await this.#fetchText(this.#src);
      if (this.#destroyed) return;

      const parsed = parseM3u8(manifestText, this.#src);
      let startLevel = 0;

      if (parsed.kind === 'multivariant') {
        this.#multivariant = parsed;
        const levels = this.#buildLevels(parsed);
        this.#store.patch({ levels });

        this.#sortedLevelIds = parsed.variants
          .map((_, index) => index)
          .sort((a, b) => parsed.variants[a].bandwidth - parsed.variants[b].bandwidth);
        this.#abr.setLevels(this.#sortedLevelIds.map((id) => parsed.variants[id].bandwidth));

        startLevel = this.#sortedLevelIds[0];
        this.#loadingLevel = startLevel;
        this.#videoTrack.uri = parsed.variants[startLevel].uri;

        // demuxed audio renditions for this variant's audio group
        const audioGroup = parsed.variants[startLevel].audioGroup;
        this.#audioRenditions = parsed.renditions.filter(
          (rendition) => rendition.type === 'AUDIO' && rendition.groupId === audioGroup && rendition.uri
        );
        if (this.#audioRenditions.length) {
          const defaultIndex = Math.max(0, this.#audioRenditions.findIndex((rendition) => rendition.isDefault));
          this.#currentAudioRendition = defaultIndex;
          this.#audioTrack = this.#emptyTrack('audio');
          this.#audioTrack.uri = this.#audioRenditions[defaultIndex].uri!;
          this.#store.patch({
            audioTracks: this.#audioRenditions.map(
              (rendition, index): ShipVideoAudioTrack => ({
                id: index,
                groupId: rendition.groupId,
                name: rendition.name,
                lang: rendition.lang,
                channels: rendition.channels,
                default: rendition.isDefault,
              })
            ),
            currentAudioTrack: defaultIndex,
          });
        }
      } else {
        this.#store.patch({ levels: [{ id: 0, bitrate: 0, label: 'Default' }] });
        this.#abr.setLevels([0]);
        this.#loadingLevel = 0;
        this.#videoTrack.uri = this.#src;
        this.#adoptVideoPlaylist(0, parsed);
      }

      // fetch video + audio playlists concurrently
      await Promise.all([
        this.#videoTrack.playlist ? Promise.resolve() : this.#loadVideoPlaylist(this.#loadingLevel),
        this.#audioTrack ? this.#loadTrackPlaylist(this.#audioTrack) : Promise.resolve(),
      ]);

      const playlist = this.#videoTrack.playlist;
      if (!playlist) return;

      if (playlist.segments.some((segment) => segment.keyMethod && segment.keyMethod !== 'NONE')) {
        this.#fail({ fatal: true, type: 'media', code: 'drm-unsupported', detail: 'Encrypted HLS is not supported' });
        return;
      }

      // legacy MPEG-TS segments (no EXT-X-MAP, .ts extension) → wasm transmuxer;
      // output is muxed fMP4, so separate audio renditions don't apply
      const firstSegment = playlist.segments[0];
      this.#tsMode = !playlist.map && !!firstSegment && /\.(ts|m2ts|mts)(\?|#|$)/i.test(firstSegment.uri);
      if (this.#tsMode) {
        this.#audioTrack = null;
        this.#store.patch({ audioTracks: [], currentAudioTrack: -1 });
        const { TsTransmuxer } = await import('@ship-ui/core/ship-video/engine/transmux');
        this.#transmuxer = await TsTransmuxer.create();
        if (this.#destroyed) return;
      } else {
        this.#setupSourceBuffers();
      }
      this.#store.emit({ type: 'manifest-parsed' });

      if (playlist.live) {
        const info = computeLiveInfo({
          playlist,
          currentTime: 0,
          liveEdgeOffsetTargets: this.#config.liveEdgeOffsetTargets,
        });
        const edgeSegment = this.#segmentAtPlaylistTime(playlist, info.liveEdge);
        this.#videoTrack.nextSn = edgeSegment?.sn ?? playlist.segments[0]?.sn ?? 0;
        this.#alignAudioToVideo();
        this.#scheduleReload(playlist.targetDuration);
      } else {
        this.#videoTrack.nextSn = playlist.segments[0]?.sn ?? 0;
        if (this.#audioTrack?.playlist) {
          this.#audioTrack.nextSn = this.#audioTrack.playlist.segments[0]?.sn ?? 0;
        }
        if (this.#mediaSource && this.#mediaSource.readyState === 'open') {
          try {
            this.#mediaSource.duration = playlist.totalDuration;
          } catch {
            // duration set can fail transiently; VOD end is signalled via endOfStream
          }
        }
      }

      this.#tickTimer = setInterval(() => void this.#tick(), TICK_INTERVAL);
      this.#startGapController();
      void this.#tick();
    } catch (cause) {
      this.#fail({
        fatal: true,
        type: 'network',
        code: 'manifest-load',
        detail: cause instanceof Error ? cause.message : 'Failed to load manifest',
        cause,
      });
    }
  };

  #buildLevels(playlist: HlsMultivariantPlaylist): ShipVideoQualityLevel[] {
    return playlist.variants.map((variant, index) => ({
      id: index,
      width: variant.width,
      height: variant.height,
      bitrate: variant.bandwidth,
      codecs: variant.codecs,
      frameRate: variant.frameRate,
      label: variantLabel(variant, index),
    }));
  }

  #setupSourceBuffers() {
    const mediaSource = this.#mediaSource;
    if (!mediaSource) return;

    const ctor = getMediaSourceCtor();
    const variant = this.#multivariant?.variants[this.#loadingLevel];
    const { video: videoCodec, audio: audioCodec } = splitCodecs(variant?.codecs);
    const demuxed = this.#audioTrack !== null;

    const pickSupported = (candidates: string[]): string => {
      if (!ctor?.isTypeSupported) return candidates[0];
      return candidates.find((candidate) => ctor.isTypeSupported!(candidate)) ?? candidates[candidates.length - 1];
    };

    try {
      const videoMime = demuxed
        ? pickSupported([videoCodec ? `video/mp4; codecs="${videoCodec}"` : 'video/mp4', 'video/mp4'])
        : pickSupported([
            variant?.codecs ? `video/mp4; codecs="${variant.codecs}"` : 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"',
            'video/mp4',
          ]);

      const videoSb = mediaSource.addSourceBuffer(videoMime) as unknown as SourceBufferLike;
      this.#videoTrack.sourceBuffer = videoSb;
      this.#videoTrack.queue = new SourceBufferQueue(videoSb);

      if (demuxed && this.#audioTrack) {
        const audioMime = pickSupported([
          audioCodec ? `audio/mp4; codecs="${audioCodec}"` : 'audio/mp4; codecs="mp4a.40.2"',
          'audio/mp4',
        ]);
        const audioSb = mediaSource.addSourceBuffer(audioMime) as unknown as SourceBufferLike;
        this.#audioTrack.sourceBuffer = audioSb;
        this.#audioTrack.queue = new SourceBufferQueue(audioSb);
      }
    } catch (cause) {
      this.#fail({
        fatal: true,
        type: 'media',
        code: 'unsupported',
        detail: 'addSourceBuffer failed',
        cause,
      });
    }
  }

  #startGapController() {
    const video = this.#video;
    if (!video) return;

    this.#gap = new GapController(video, {
      onStallStart: () => this.#store.patch({ stalled: true }),
      onStallRecovered: () => this.#store.patch({ stalled: false }),
      onNudge: (seconds) => {
        if (this.#video) this.#video.currentTime += seconds;
      },
      onGiveUp: () => {
        this.#store.emit({
          type: 'error',
          error: { fatal: false, type: 'media', code: 'stall', detail: 'Playback stalled; nudging failed' },
        });
      },
    });
  }

  // -- playlist loading ------------------------------------------------------

  async #loadVideoPlaylist(level: number) {
    const uri = this.#multivariant?.variants[level]?.uri ?? this.#videoTrack.uri;
    if (!uri || this.#videoTrack.loading) return;

    this.#videoTrack.loading = true;
    try {
      const parsed = await this.#fetchPlaylist(uri);
      this.#adoptVideoPlaylist(level, parsed);
      this.#reloadErrorCount = 0;
    } catch (cause) {
      this.#reloadErrorCount++;
      if (this.#reloadErrorCount >= MAX_RELOAD_ERRORS) {
        this.#fail({
          fatal: true,
          type: 'network',
          code: 'manifest-load',
          detail: 'Media playlist failed repeatedly',
          cause,
        });
      }
    } finally {
      this.#videoTrack.loading = false;
    }
  }

  async #loadTrackPlaylist(track: StreamTrack) {
    if (!track.uri || track.loading) return;

    track.loading = true;
    try {
      track.playlist = await this.#fetchPlaylist(track.uri);
      if (track.nextSn < 0) {
        track.nextSn = track.playlist.segments[0]?.sn ?? 0;
      }
    } catch {
      // audio playlist failures degrade to video-only; retried on later ticks
      track.playlist = null;
    } finally {
      track.loading = false;
    }
  }

  async #fetchPlaylist(uri: string): Promise<HlsMediaPlaylist> {
    const text = await this.#fetchText(uri);
    const parsed = parseM3u8(text, uri);
    if (parsed.kind !== 'media') throw new Error('Expected a media playlist');
    return parsed;
  }

  #adoptVideoPlaylist(level: number, playlist: HlsMediaPlaylist) {
    const previous = this.#levelPlaylists.get(level) ?? this.#videoTrack.playlist;

    if (previous && previous.live) {
      // Slide the absolute timeline anchor by the segments that left the window.
      const removed = previous.segments.filter((segment) => segment.sn < playlist.mediaSequence);
      this.#playlistStartTime += removed.reduce((sum, segment) => sum + segment.duration, 0);
    }

    this.#levelPlaylists.set(level, playlist);
    this.#videoTrack.playlist = playlist;
    this.#store.patch({ isLive: playlist.live });
  }

  #alignAudioToVideo() {
    const audio = this.#audioTrack;
    const videoPlaylist = this.#videoTrack.playlist;
    if (!audio?.playlist || !videoPlaylist) return;

    const videoSegment = this.#segmentBySn(videoPlaylist, this.#videoTrack.nextSn);
    const targetTime = videoSegment?.start ?? 0;
    const audioSegment = this.#segmentAtPlaylistTime(audio.playlist, targetTime) ?? audio.playlist.segments[0];
    if (audioSegment) audio.nextSn = audioSegment.sn;
  }

  #scheduleReload(targetDuration: number, changed = true) {
    if (this.#destroyed || !this.#videoTrack.playlist?.live) return;

    const delay = nextReloadDelay({
      changed,
      targetDuration,
      errorCount: this.#reloadErrorCount,
    });

    this.#reloadTimer = setTimeout(async () => {
      const level = this.#loadingLevel;
      const before = this.#levelPlaylists.get(level);
      await this.#loadVideoPlaylist(level);
      const after = this.#levelPlaylists.get(level);

      if (this.#audioTrack) {
        this.#audioTrack.playlist = null;
        await this.#loadTrackPlaylist(this.#audioTrack);
      }

      const didChange =
        !before || !after || before.mediaSequence !== after.mediaSequence || before.segments.length !== after.segments.length;

      this.#updateLiveState();
      this.#scheduleReload(after?.targetDuration ?? targetDuration, didChange);
    }, delay * 1000);
  }

  #updateLiveState() {
    const playlist = this.#videoTrack.playlist;
    const video = this.#video;
    if (!playlist || !video || !playlist.live) return;

    const info = computeLiveInfo({
      playlist,
      currentTime: video.currentTime,
      liveEdgeOffsetTargets: this.#config.liveEdgeOffsetTargets,
      startOffset: this.#playlistStartTime + (this.#mediaTimeOffset ?? 0),
    });

    this.#store.patch({
      isLive: true,
      liveEdge: info.liveEdge,
      dvrWindow: info.dvrWindow,
      latency: info.latency,
      atLiveEdge: info.atLiveEdge,
    });
  }

  // -- streaming loop --------------------------------------------------------

  async #tick() {
    const video = this.#video;
    // TS mode creates its SourceBuffer from the first transmux result, so the
    // loop must run before the queue exists
    if (this.#destroyed || !video || this.#ticking) return;
    if (!this.#videoTrack.queue && !this.#tsMode) return;

    this.#ticking = true;
    try {
      this.#gap?.tick(Date.now());
      this.#updateBufferState();

      const forward = forwardBufferLength(video.buffered, video.currentTime);
      // pre-start: only warm a couple of segments (first frame + fast start);
      // hidden tab: keep the window small
      let maxForward = this.#quota.maxForwardBuffer;
      if (!this.#playbackStarted) maxForward = Math.min(10, maxForward);
      else if (!this.#visible) maxForward = Math.min(15, maxForward);
      if (!shouldLoadMore({ forwardBufferSeconds: forward, maxForwardBuffer: maxForward })) return;

      this.#evict(video.currentTime);

      // ABR decision (video track only); ABR index space is bitrate-ascending
      const decidedIndex = this.#abr.nextLevel(this.#estimator.getEstimate(), forward);
      const decided = this.#sortedLevelIds[decidedIndex] ?? this.#loadingLevel;
      if (decided !== this.#loadingLevel && this.#multivariant && !this.#videoTrack.loadingSegment) {
        this.#loadingLevel = decided;
        this.#videoTrack.uri = this.#multivariant.variants[decided].uri;
        this.#store.patch({ loadingLevel: decided });
        if (!this.#levelPlaylists.has(decided)) {
          await this.#loadVideoPlaylist(decided);
          return;
        }
        this.#videoTrack.playlist = this.#levelPlaylists.get(decided)!;
        return;
      }

      // audio and video load concurrently — each track has its own SourceBuffer
      for (const track of [this.#videoTrack, this.#audioTrack]) {
        if (!track || track.done || track.loadingSegment) continue;
        if (!track.queue && !this.#tsMode) continue;

        if (!track.playlist) {
          void this.#loadTrackPlaylist(track);
          continue;
        }

        const segment = this.#segmentBySn(track.playlist, track.nextSn);
        if (!segment) {
          if (!track.playlist.live && track.nextSn > (track.playlist.segments.at(-1)?.sn ?? -1)) {
            track.done = true;
            this.#maybeFinishStream();
          }
          continue;
        }

        track.loadingSegment = true;
        void this.#loadAndAppend(track, segment).finally(() => (track.loadingSegment = false));
      }
    } finally {
      this.#ticking = false;
    }
  }

  #evict(currentTime: number) {
    for (const track of [this.#videoTrack, this.#audioTrack]) {
      if (!track?.queue || !track.sourceBuffer) continue;

      const eviction = computeEviction({
        buffered: bufferedToRanges(track.sourceBuffer.buffered),
        currentTime,
        backBufferLength: this.#config.backBufferLength,
      });
      if (eviction) track.queue.remove(eviction.start, eviction.end).catch(() => {});
    }
  }

  async #loadAndAppend(track: StreamTrack, segment: HlsSegment) {
    if (this.#tsMode) {
      await this.#loadAndTransmux(track, segment);
      return;
    }

    const queue = track.queue;
    const playlist = track.playlist;
    if (!queue || !playlist) return;

    try {
      // fetch init and media segment concurrently; appends stay ordered
      const needsInit = track.appendedInitUri !== (playlist.map?.uri ?? null) && !!playlist.map;
      const initPromise = needsInit
        ? this.#initCache.get(playlist.map!.uri) ?? this.#fetchBytes(playlist.map!.uri, playlist.map!.byteRange)
        : null;
      const segmentPromise = this.#fetchSegment(track, segment);

      if (initPromise && playlist.map) {
        const init = await initPromise;
        this.#initCache.set(playlist.map.uri, init);
        await this.#appendWithQuotaRetry(track, init);
        track.appendedInitUri = playlist.map.uri;
      }

      const data = await segmentPromise;
      if (this.#destroyed) return;

      await this.#appendWithQuotaRetry(track, data);
      this.#afterAppend(track, segment);
    } catch (cause) {
      if ((cause as Error)?.name === 'AbortError') return;

      track.retries++;
      if (track.retries > MAX_SEGMENT_RETRIES) {
        this.#fail({
          fatal: true,
          type: 'network',
          code: 'segment-load',
          detail: `${track.kind} segment ${segment.sn} failed after ${MAX_SEGMENT_RETRIES} retries`,
          cause,
        });
      }
    }
  }

  /** Fetch, transmux (TS → fMP4) and append one legacy MPEG-TS segment. */
  async #loadAndTransmux(track: StreamTrack, segment: HlsSegment) {
    const transmuxer = this.#transmuxer;
    if (!transmuxer) return;

    try {
      const raw = await this.#fetchSegment(track, segment);
      if (this.#destroyed) return;

      if (segment.cc !== this.#lastTsCc && this.#lastTsCc !== -1) transmuxer.reset();
      this.#lastTsCc = segment.cc;

      const result = transmuxer.transmux(raw);

      if (!track.queue) this.#setupTsSourceBuffer(result.videoCodec, result.audioCodec);
      if (!track.queue) return;

      if (result.init) {
        await this.#appendWithQuotaRetry(track, result.init.buffer as ArrayBuffer);
      }
      await this.#appendWithQuotaRetry(track, result.media.buffer as ArrayBuffer);
      this.#afterAppend(track, segment);
    } catch (cause) {
      if ((cause as Error)?.name === 'AbortError') return;

      if ((cause as Error)?.name === 'TsTransmuxError') {
        this.#fail({
          fatal: true,
          type: 'mux',
          code: 'unsupported',
          detail: (cause as Error).message,
          cause,
        });
        return;
      }

      track.retries++;
      if (track.retries > MAX_SEGMENT_RETRIES) {
        this.#fail({
          fatal: true,
          type: 'network',
          code: 'segment-load',
          detail: `TS segment ${segment.sn} failed after ${MAX_SEGMENT_RETRIES} retries`,
          cause,
        });
      }
    }
  }

  #setupTsSourceBuffer(videoCodec: string, audioCodec: string) {
    const mediaSource = this.#mediaSource;
    if (!mediaSource) return;

    const codecs = [videoCodec, audioCodec].filter(Boolean).join(',');
    const mime = codecs ? `video/mp4; codecs="${codecs}"` : 'video/mp4';

    try {
      const sourceBuffer = mediaSource.addSourceBuffer(mime) as unknown as SourceBufferLike;
      this.#videoTrack.sourceBuffer = sourceBuffer;
      this.#videoTrack.queue = new SourceBufferQueue(sourceBuffer);
    } catch (cause) {
      this.#fail({ fatal: true, type: 'media', code: 'unsupported', detail: `addSourceBuffer failed for ${mime}`, cause });
    }
  }

  /**
   * Streams a media segment: per-chunk bandwidth samples (video track) and an
   * emergency abort mid-download when the level clearly can't be sustained.
   */
  async #fetchSegment(track: StreamTrack, segment: HlsSegment): Promise<ArrayBuffer> {
    const headers: Record<string, string> = {};
    if (segment.byteRange) {
      headers['Range'] = `bytes=${segment.byteRange.offset}-${segment.byteRange.offset + segment.byteRange.length - 1}`;
    }

    const controller = new AbortController();
    this.#inflight.add(controller);
    try {
      // anchor timing at request start so TTFB counts toward the first
      // chunk's throughput sample
      let lastChunkAt = Date.now();
      const response = await this.#fetchFn(segment.uri, { signal: controller.signal, headers });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${segment.uri}`);
      if (!response.body) return response.arrayBuffer();

      const contentLength = Number(response.headers.get('content-length')) || 0;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (this.#destroyed) {
          controller.abort();
          throw new DOMException('destroyed', 'AbortError');
        }

        chunks.push(value);
        received += value.byteLength;

        if (track.kind === 'video') {
          const now = Date.now();
          this.#estimator.sample(Math.max(1, now - lastChunkAt), value.byteLength);
          lastChunkAt = now;

          // emergency: this level is unsustainable and the buffer is nearly dry.
          // Only worth aborting when a lower level exists to switch to AND some
          // buffer is already playing — otherwise finishing the download is
          // strictly better (aborting the only/first segment just livelocks).
          const canDownSwitch = this.#loadingLevel !== this.#sortedLevelIds[0];
          const forward = this.#video ? forwardBufferLength(this.#video.buffered, this.#video.currentTime) : 0;
          if (contentLength > received && this.#abr.autoLevel && canDownSwitch && forward > 0.5) {
            const abort = this.#abr.shouldAbortInflight({
              inflightLevelBitrate: this.#store.getState().levels[this.#loadingLevel]?.bitrate ?? 0,
              bandwidthEstimate: this.#estimator.getEstimate(),
              forwardBufferSeconds: forward,
              remainingBytes: contentLength - received,
            });
            if (abort) {
              controller.abort();
              throw new DOMException('abr-abort', 'AbortError');
            }
          }
        }
      }

      this.#store.patch({ bandwidthEstimate: this.#estimator.getEstimate() });

      const data = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return data.buffer;
    } finally {
      this.#inflight.delete(controller);
    }
  }

  async #appendWithQuotaRetry(track: StreamTrack, data: ArrayBuffer) {
    const queue = track.queue;
    const video = this.#video;
    if (!queue || !video) return;

    try {
      await queue.append(data);
      this.#quota.reset();
    } catch (cause) {
      if ((cause as Error)?.name !== 'QuotaExceededError') throw cause;

      const { evictBehind, retry } = this.#quota.onQuotaExceeded();
      const ranges = track.sourceBuffer ? bufferedToRanges(track.sourceBuffer.buffered) : [];
      if (ranges.length) {
        const evictEnd = Math.max(ranges[0].start, video.currentTime - evictBehind);
        if (evictEnd > ranges[0].start) await queue.remove(ranges[0].start, evictEnd).catch(() => {});
      }

      if (!retry) {
        this.#store.emit({
          type: 'error',
          error: { fatal: false, type: 'media', code: 'quota', detail: 'SourceBuffer quota exceeded' },
        });
        throw cause;
      }
      await queue.append(data);
    }
  }

  #afterAppend(track: StreamTrack, segment: HlsSegment) {
    const video = this.#video;
    track.retries = 0;
    track.nextSn = segment.sn + 1;

    if (track.kind === 'video' && this.#loadingLevel !== this.#store.getState().currentLevel) {
      this.#store.patch({ currentLevel: this.#loadingLevel });
      this.#store.emit({ type: 'level-switched', level: this.#loadingLevel });
    }

    // Anchor playlist time to the media timeline on the first video append and
    // jump the playhead into the buffered range (live joins, non-zero tfdt).
    if (track.kind === 'video' && this.#mediaTimeOffset === null && video && video.buffered.length) {
      const bufferedStart = video.buffered.start(0);
      const playlistTime = this.#playlistStartTime + segment.start;
      this.#mediaTimeOffset = bufferedStart - playlistTime;

      if (video.currentTime < bufferedStart || video.currentTime > video.buffered.end(video.buffered.length - 1)) {
        video.currentTime = bufferedStart + 0.05;
      }
      this.#updateLiveState();
    }

    this.#updateBufferState();
  }

  #maybeFinishStream() {
    if (!this.#videoTrack.queue) return; // nothing was ever appended

    const tracks = [this.#videoTrack, this.#audioTrack].filter(Boolean) as StreamTrack[];
    const allDone = tracks.every((track) => track.done || !track.queue);
    const pending = tracks.reduce((sum, track) => sum + (track.queue?.pending ?? 0), 0);

    if (this.#endedSignalled || !allDone || pending > 0) return;
    if (this.#videoTrack.playlist?.live) return;

    this.#endedSignalled = true;
    if (this.#mediaSource?.readyState === 'open') {
      try {
        this.#mediaSource.endOfStream();
      } catch {
        // ignore transient InvalidStateError
      }
    }
  }

  #updateBufferState() {
    const video = this.#video;
    if (!video) return;

    this.#store.patch({
      forwardBufferLength: forwardBufferLength(video.buffered, video.currentTime),
    });
  }

  // -- media events ----------------------------------------------------------

  #onSeeking = () => {
    const video = this.#video;
    const playlist = this.#videoTrack.playlist;
    if (!video || !playlist) return;

    // target inside buffer → let the browser handle it
    const ranges = bufferedToRanges(video.buffered);
    const target = video.currentTime;
    if (ranges.some((range) => target >= range.start - 0.1 && target <= range.end)) return;

    for (const controller of this.#inflight) controller.abort();
    this.#inflight.clear();

    const playlistTime = target - (this.#mediaTimeOffset ?? 0) - this.#playlistStartTime;
    for (const track of [this.#videoTrack, this.#audioTrack]) {
      if (!track?.queue || !track.playlist) continue;

      track.queue.abortAndFlush();
      const segment =
        this.#segmentAtPlaylistTime(track.playlist, playlistTime) ??
        (playlistTime <= 0 ? track.playlist.segments[0] : track.playlist.segments.at(-1));
      if (segment) {
        track.nextSn = segment.sn;
        track.done = false;
      }
    }
    this.#endedSignalled = false;
  };

  #onEnded = () => {
    this.#store.emit({ type: 'ended' });
  };

  #onPlay = () => {
    this.#playbackStarted = true;
  };

  /** O(1): sequence numbers are contiguous, so sn maps straight to an index. */
  #segmentBySn(playlist: HlsMediaPlaylist, sn: number): HlsSegment | undefined {
    const segment = playlist.segments[sn - playlist.mediaSequence];
    return segment?.sn === sn ? segment : playlist.segments.find((candidate) => candidate.sn === sn);
  }

  /** O(log n) binary search over cumulative segment start times (10h VODs have ~6-9k segments). */
  #segmentAtPlaylistTime(playlist: HlsMediaPlaylist, playlistTime: number): HlsSegment | undefined {
    const segments = playlist.segments;
    if (!segments.length) return undefined;

    let low = 0;
    let high = segments.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      const segment = segments[mid];
      if (playlistTime < segment.start) {
        high = mid - 1;
      } else if (playlistTime >= segment.start + segment.duration) {
        low = mid + 1;
      } else {
        return segment;
      }
    }
    return undefined;
  }

  // -- io --------------------------------------------------------------------

  async #fetchText(url: string): Promise<string> {
    const response = await this.#fetch(url);
    return response.text();
  }

  async #fetchBytes(url: string, byteRange?: { offset: number; length: number }): Promise<ArrayBuffer> {
    const headers: Record<string, string> = {};
    if (byteRange) {
      headers['Range'] = `bytes=${byteRange.offset}-${byteRange.offset + byteRange.length - 1}`;
    }
    const response = await this.#fetch(url, headers);
    return response.arrayBuffer();
  }

  async #fetch(url: string, headers?: Record<string, string>): Promise<Response> {
    const controller = new AbortController();
    this.#inflight.add(controller);
    try {
      const response = await this.#fetchFn(url, { signal: controller.signal, headers });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return response;
    } finally {
      this.#inflight.delete(controller);
    }
  }

  #fail(error: ShipVideoEngineError) {
    this.#store.patch({ error });
    this.#store.emit({ type: 'error', error });
  }
}
