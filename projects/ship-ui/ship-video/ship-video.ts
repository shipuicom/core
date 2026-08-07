import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { shipComponentClasses, ShipColor } from '@ship-ui/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import type { ShipVideoEngine, ShipVideoEngineError, ShipVideoQualityLevel } from './engine/types';
import { ShipVideoAirplayButton, ShipVideoCastButton, ShipVideoControls } from './ship-video-controls';
import { ShipVideoPlayerHooks, ShipVideoState } from './ship-video-state';
import {
  ShipVideoAd,
  ShipVideoAdCreative,
  ShipVideoSource,
  ShipVideoTrack,
  shipVideoLevelsFromSources,
  shipVideoToSourceArray,
} from './ship-video-types';

// Structural types: Remote Playback API and WebKit AirPlay, feature-detected at runtime.
type RemotePlaybackLike = {
  prompt?: () => Promise<void>;
  watchAvailability: (callback: (available: boolean) => void) => Promise<number>;
  cancelWatchAvailability?: (id: number) => Promise<void>;
  addEventListener: (type: 'connect' | 'disconnect', listener: () => void) => void;
  removeEventListener: (type: 'connect' | 'disconnect', listener: () => void) => void;
};
type WebKitVideoElement = HTMLVideoElement & {
  webkitShowPlaybackTargetPicker?: () => void;
  webkitCurrentPlaybackTargetIsWireless?: boolean;
};
type WebKitWindow = Window & { WebKitPlaybackTargetAvailabilityEvent?: unknown };

const CONTROLS_IDLE_TIMEOUT = 2600;
const CONTROLS_IDLE_TIMEOUT_TOUCH = 4000;
const DEFAULT_SKIP_AFTER = 5;
const AD_RESOLVE_TIMEOUT = 8000;
const SEEK_EPSILON = 0.3;
const RESUME_MIN_SECONDS = 5;
const RESUME_SAVE_INTERVAL = 5;

function isHlsSource(source: ShipVideoSource | undefined): boolean {
  if (!source) return false;
  if (source.type === 'application/vnd.apple.mpegurl') return true;
  return /\.m3u8(\?|#|$)/.test(source.src);
}

@Component({
  selector: 'sh-video',
  styleUrl: './ship-video.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon, ShipVideoControls, ShipVideoCastButton, ShipVideoAirplayButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ShipVideoState,
      useFactory: () => inject(ShipVideoState, { optional: true, skipSelf: true }) ?? new ShipVideoState(),
    },
  ],
  host: {
    '[class]': 'hostClasses()',
    '[class.is-playing]': 'state.playing()',
    '[class.is-started]': 'state.hasStarted()',
    '[class.is-ad]': 'state.adActive()',
    '[class.is-live]': 'state.isLive()',
    '[class.is-fullscreen]': 'state.isFullscreen()',
    '[class.hide-controls]': '!state.controlsVisible()',
    '[attr.tabindex]': 'interactive() ? 0 : null',
    '(keydown)': 'onKeydown($event)',
    '(pointerdown)': 'onHostPointerDown($event)',
    '(pointermove)': 'wakeControls()',
    '(pointerleave)': 'sleepControls()',
    '(document:fullscreenchange)': 'syncFullscreenState()',
    '(document:visibilitychange)': 'syncVisibility()',
  },
  template: `
    @if (activated()) {
      <video
        #media
        class="sh-video-media sh-video-main-media"
        [attr.poster]="activePoster() || null"
        [attr.preload]="effectivePreload()"
        [attr.crossorigin]="crossOrigin()"
        [loop]="loop()"
        playsinline
        (click)="onSurfaceClick()"
        (play)="onMainPlay()"
        (pause)="onMainPause()"
        (ended)="onMainEnded()"
        (seeking)="state.seeking.set(true)"
        (seeked)="state.seeking.set(false)"
        (timeupdate)="onMainTimeUpdate()"
        (loadedmetadata)="onMainLoadedMetadata()"
        (durationchange)="onMainLoadedMetadata()"
        (progress)="onMainProgress()"
        (waiting)="state.stalled.set(true)"
        (playing)="state.stalled.set(false)"
        (error)="onMainError()"
        (enterpictureinpicture)="state.isPip.set(true)"
        (leavepictureinpicture)="state.isPip.set(false)">
        @if (!engineActive()) {
          @for (source of renderedSources(); track source.src) {
            <source [src]="source.src" [attr.type]="source.type || null" />
          }
          @for (track of activeTracks(); track track.src; let trackIndex = $index) {
            <track
              [src]="track.src"
              [srclang]="track.srclang"
              [label]="track.label"
              [attr.kind]="track.kind || 'subtitles'"
              [attr.data-sh-track-id]="trackIndex" />
          }
        }
      </video>
    }

    @if (state.adActive() && state.adCreative(); as creative) {
      <video
        #adMedia
        class="sh-video-media sh-video-ad-media"
        autoplay
        playsinline
        (click)="onSurfaceClick()"
        (play)="onAdPlay()"
        (pause)="onAdPause()"
        (ended)="finishAd(false)"
        (error)="finishAd(false)"
        (timeupdate)="onAdTimeUpdate()"
        (loadedmetadata)="onAdLoadedMetadata()">
        @for (source of adSources(); track source.src) {
          <source [src]="source.src" [attr.type]="source.type || null" />
        }
      </video>

      <div class="sh-video-ad-top">
        <span class="sh-video-ad-badge">{{ creative.label || 'Ad' }}</span>

        @if (creative.clickThroughUrl; as url) {
          <a
            class="sh-video-ad-link"
            [href]="url"
            target="_blank"
            rel="noopener noreferrer"
            (click)="adClicked.emit(url)">
            {{ creative.clickThroughLabel || 'Visit advertiser' }}
            <sh-icon size="small">arrow-square-out</sh-icon>
          </a>
        }
      </div>

      @if (adSkipEnabled()) {
        <div class="sh-video-ad-skip-slot" aria-live="polite">
          @if (adSkipCountdown() > 0) {
            <div class="sh-video-ad-skip waiting">Skip in {{ adSkipCountdown() }}</div>
          } @else {
            <button type="button" class="sh-video-ad-skip" (click)="finishAd(true)">
              Skip ad
              <sh-icon size="small">skip-forward-fill</sh-icon>
            </button>
          }
        </div>
      }
    }

    @if (!state.hasStarted()) {
      <button
        type="button"
        class="sh-video-featured"
        [disabled]="!interactive()"
        (click)="start()"
        (pointerenter)="warmUp()"
        (focus)="warmUp()"
        aria-label="Play video">
        @if (activePoster(); as posterUrl) {
          <img class="sh-video-featured-image" [src]="posterUrl" alt="" decoding="async" />
        }
      </button>
    }

    <ng-content select="[shVideoOverlay]" />

    <!-- remote playback lives top-right (YouTube/Netflix convention); the
         buttons render nothing unless a target is actually available -->
    <div class="sh-video-corner-controls">
      <sh-video-cast-button />
      <sh-video-airplay-button />
    </div>

    @if (!projectedControls().length) {
      <sh-video-controls [defaultLayout]="true" />
    }
    <ng-content />
  `,
})
export class ShipVideo {
  readonly state = inject(ShipVideoState);
  #selfRef = inject(ElementRef<HTMLElement>);
  #document = inject(DOCUMENT);
  #platformId = inject(PLATFORM_ID);
  #isBrowser = isPlatformBrowser(this.#platformId);

  #engine: ShipVideoEngine | null = null;
  #engineGeneration = 0;
  #engineUnsubscribers: Array<() => void> = [];
  #idleTimer: ReturnType<typeof setTimeout> | null = null;
  #adCompleted = false;
  #adResolveToken = 0;
  #frameCallbacks = new Set<(time: number) => void>();
  #frameCallbackHandle: number | null = null;
  #lastFrameDuration = 1 / 30;
  #lastFrameMediaTime = 0;
  #lastResumeSave = 0;
  #restoredResume = false;
  #lastContentKey = '';
  #unlocking = false;
  #slateApplied = false;
  #appliedSlateTime = 0.001;
  #lastPointerWasTouch = false;
  #lastInputWasKeyboard = false;
  #controlsVisibleAtPointerDown = true;
  #destroyed = false;
  #intersectionObserver: IntersectionObserver | null = null;

  mediaRef = viewChild<ElementRef<HTMLVideoElement>>('media');
  adMediaRef = viewChild<ElementRef<HTMLVideoElement>>('adMedia');
  projectedControls = contentChildren(ShipVideoControls);

  /** Video source(s): a URL or a list of `ShipVideoSource` (format/quality/language variants). */
  sources = input<string | ShipVideoSource[] | null>(null);
  /** Featured image shown before playback starts (also the video poster). */
  poster = input<string | null>(null);
  /** Pre-roll advertisement: inline creative or async resolver (VAST-ready). */
  ad = input<ShipVideoAd | null>(null);
  /** Subtitle/caption tracks (WebVTT). */
  tracks = input<ShipVideoTrack[]>([]);
  /** Loops the content video when `true`. */
  loop = input(false);
  /** Preload strategy of the content video. */
  preload = input<'auto' | 'metadata' | 'none'>('metadata');
  /**
   * Shows a video frame as the featured image when no poster is set.
   * `true` (default) picks a frame ~10% into the video (capped at 20s) so
   * fade-from-black intros still yield a real image; a number grabs the frame
   * at that exact time in seconds; `false` opts out. Playback always starts
   * from the beginning.
   */
  firstFrame = input<boolean | number>(true);
  /** Defers all network work until the player nears the viewport. */
  lazy = input(false);
  /** localStorage key for resuming playback position. */
  resumeKey = input<string | null>(null);
  /** Speeds offered by the settings menu. */
  playbackRates = input<number[]>([0.5, 1, 1.25, 1.5, 2]);
  /** When `false`, the player ignores clicks/keyboard — a wrapper (editor) drives it. */
  interactive = input(true);
  /**
   * `crossorigin` for the media elements. Required for auto first-frame
   * scoring and canvas capture of cross-origin media whose server sends CORS
   * headers; leave `null` for hosts without CORS or the video won't load.
   */
  crossOrigin = input<'anonymous' | 'use-credentials' | null>(null);

  /** Accent color of played bar and active states (`ShipColor`). */
  color = input<ShipColor | null>(null);
  /** When `true`, renders the player with sharp (non-rounded) corners. */
  sharp = input<boolean | undefined>(undefined);

  /** Two-way bound volume from `0` to `1`. */
  volume = model(1);
  /** Two-way bound muted state. */
  muted = model(false);
  /** Two-way bound playback rate. */
  playbackRate = model(1);
  /** Two-way bound quality: `'auto'` or a level id. */
  quality = model<'auto' | number>('auto');
  /** Two-way bound subtitle track id, `null` = off. */
  textTrack = model<number | null>(null);

  /** Emits when playback starts for the first time (before a potential ad). */
  videoStarted = output<void>();
  /** Emits when the content video starts or resumes playing. */
  videoPlayed = output<void>();
  /** Emits when the content video is paused. */
  videoPaused = output<void>();
  /** Emits when the content video ends. */
  videoEnded = output<void>();
  /** Emits the content current time (seconds) while playing. */
  videoTimeUpdated = output<number>();
  /** Emits when the pre-roll ad starts. */
  adStarted = output<void>();
  /** Emits when the pre-roll ad is skipped. */
  adSkipped = output<void>();
  /** Emits when the pre-roll ad finishes (ended or skipped). */
  adEnded = output<void>();
  /** Emits the click-through URL when the ad link is clicked. */
  adClicked = output<string>();
  /** Emits the quality ladder once known (engine manifest or height-tagged sources). */
  qualityLevels = output<readonly ShipVideoQualityLevel[]>();
  /** Emits engine/media errors. */
  videoError = output<ShipVideoEngineError>();

  activated = signal(false);
  warmedUp = signal(false);

  /** Programmatic content overrides (playlist/editor); take precedence over the inputs. */
  playlistSources = signal<ShipVideoSource[] | null>(null);
  playlistPoster = signal<string | null>(null);
  playlistAd = signal<ShipVideoAd | null>(null);
  playlistTracks = signal<ShipVideoTrack[] | null>(null);

  hostClasses = shipComponentClasses('video', {
    color: this.color,
    sharp: this.sharp,
  });

  parsedSources = computed(() => this.playlistSources() ?? shipVideoToSourceArray(this.sources()));
  activePoster = computed(() => this.playlistPoster() ?? this.poster());
  activeAd = computed(() => this.playlistAd() ?? this.ad());
  activeTracks = computed(() => this.playlistTracks() ?? this.tracks());
  engineActive = computed(() => isHlsSource(this.parsedSources()[0]));

  progressiveLevels = computed(() => (this.engineActive() ? [] : shipVideoLevelsFromSources(this.parsedSources())));

  /**
   * Slate time appended to source URLs as a `#t=` media fragment. iOS Safari
   * never paints pre-play scripted seeks, but it does render the fragment
   * frame as the preview — the only reliable mobile slate without a poster.
   */
  slateFragmentTime = signal<number | null>(null);

  /** Sources rendered as `<source>` children (progressive path only). */
  renderedSources = computed(() => {
    const sources = this.parsedSources();
    const levels = this.progressiveLevels();
    const quality = this.quality();

    let selected = sources;
    if (levels.length && quality !== 'auto') {
      const level = levels.find((candidate) => candidate.id === quality);
      const match = level && sources.find((source) => (source.label ?? `${source.height}p`) === level.label);
      if (match) selected = [match];
    }

    // the fragment stays in the URL once set — start() rewinds to 0 anyway,
    // and stripping it later would force a reload mid-playback
    const fragment = this.slateFragmentTime();
    if (fragment === null) return selected;
    return selected.map((source) =>
      source.src.includes('#') ? source : { ...source, src: `${source.src}#t=${fragment}` }
    );
  });

  // The slate frame decodes even when a poster is set — the poster image
  // simply layers on top, and the frame remains as a fallback beneath it.
  firstFrameEnabled = computed(() => this.firstFrame() !== false);

  /** Resolves the slate time once the duration is known (always in range). */
  #slateTimeFor(duration: number): number {
    const inRange = (time: number) =>
      isFinite(duration) && duration > 0 ? Math.min(Math.max(0.001, time), Math.max(0.001, duration - 1)) : Math.max(0.001, time);

    const value = this.firstFrame();
    if (typeof value === 'number') return inRange(value);
    // auto: ~10% in, capped — frame zero is black on fade-in intros
    if (isFinite(duration) && duration > 0) {
      return inRange(Math.min(duration * 0.1, 20));
    }
    return 0.001;
  }

  effectivePreload = computed(() => {
    if (this.warmedUp()) return 'auto';
    // without a poster the slate needs at least metadata to have a frame to paint
    if (this.preload() === 'none' && this.firstFrameEnabled() && !this.activePoster()) return 'metadata';
    return this.preload();
  });

  adSources = computed(() => shipVideoToSourceArray(this.state.adCreative()?.src));
  adSkipEnabled = computed(() => (this.state.adCreative()?.skipAfter ?? DEFAULT_SKIP_AFTER) !== null);
  adSkipCountdown = computed(() => {
    const skipAfter = this.state.adCreative()?.skipAfter ?? DEFAULT_SKIP_AFTER;
    if (skipAfter === null) return 0;
    return Math.max(0, Math.ceil(skipAfter - this.state.adCurrentTime()));
  });

  #hooks: ShipVideoPlayerHooks = {
    start: () => this.start(),
    seekTo: (seconds, options) => this.seekTo(seconds, options),
    step: (frames) => this.step(frames),
    onVideoFrame: (callback) => this.onVideoFrame(callback),
    goToLive: () => this.goToLive(),
    skipAd: () => this.finishAd(true),
    toggleFullscreen: () => this.toggleFullscreen(),
    togglePip: () => this.togglePip(),
    requestCast: () => this.requestCast(),
    requestAirplay: () => this.requestAirplay(),
    mediaElement: () => this.mediaRef()?.nativeElement ?? null,
  };

  constructor() {
    this.state.attachPlayer(this.#hooks);

    // input/model → store bridges (writes of equal values don't re-trigger)
    effect(() => this.state.volume.set(this.volume()));
    effect(() => this.volume.set(this.state.volume()));
    effect(() => this.state.muted.set(this.muted()));
    effect(() => this.muted.set(this.state.muted()));
    effect(() => this.state.playbackRate.set(this.playbackRate()));
    effect(() => this.playbackRate.set(this.state.playbackRate()));
    effect(() => this.state.quality.set(this.quality()));
    effect(() => this.quality.set(this.state.quality()));
    effect(() => this.state.textTrack.set(this.textTrack()));
    effect(() => this.textTrack.set(this.state.textTrack()));
    effect(() => this.state.interactive.set(this.interactive()));
    effect(() => this.state.playbackRates.set(this.playbackRates()));

    // store → media element sync
    effect(() => {
      const volume = Math.max(0, Math.min(1, this.state.volume()));
      const muted = this.state.muted();
      for (const element of this.#mediaElements()) {
        element.volume = volume;
        element.muted = muted;
      }
    });

    effect(() => {
      const rate = this.state.playbackRate();
      const media = this.mediaRef()?.nativeElement;
      if (media && rate > 0) media.playbackRate = rate;
    });

    effect(() => {
      const shouldPlay = this.state.playing();
      untracked(() => {
        if (!this.state.hasStarted()) {
          if (shouldPlay) this.start();
          return;
        }
        const media = this.#activeMedia();
        if (!media) return;
        if (shouldPlay && media.paused) this.#safePlay(media);
        if (!shouldPlay && !media.paused) media.pause();
      });
    });

    // store.currentTime written externally → seek (internal writes land within epsilon)
    effect(() => {
      const target = this.state.currentTime();
      untracked(() => {
        const media = this.mediaRef()?.nativeElement;
        if (!media || this.state.adActive()) return;
        // parked on the slate frame: the playhead intentionally differs from
        // the 0:00 the UI shows — don't "correct" it
        if (this.#slateApplied && !this.state.hasStarted()) return;
        if (Math.abs(media.currentTime - target) > SEEK_EPSILON) {
          media.currentTime = target;
        }
      });
    });

    // per-item ads: a new ad config re-arms the pre-roll
    effect(() => {
      this.activeAd();
      untracked(() => (this.#adCompleted = false));
    });

    // explicit slate time → media fragment from the very first render, so iOS
    // Safari (which ignores pre-play scripted seeks) still paints the frame.
    // (Playlist swaps re-arm inside the content-swap reset in #reload.)
    effect(() => {
      const value = this.firstFrame();
      const poster = this.activePoster();
      untracked(() => {
        if (typeof value === 'number' && !poster && !this.engineActive() && !this.state.hasStarted()) {
          this.slateFragmentTime.set(Math.max(0.001, value));
        }
      });
    });

    // progressive subtitle tracks → store + native TextTrack modes
    effect(() => {
      const tracks = this.activeTracks();
      this.state.subtitleTracks.set(
        tracks.map((track, index) => ({
          id: index,
          groupId: 'main',
          name: track.label,
          lang: track.srclang,
          forced: false,
          default: track.default ?? false,
        }))
      );
    });

    effect(() => {
      const active = this.state.textTrack();
      const media = this.mediaRef()?.nativeElement;
      if (!media || this.engineActive()) return;

      const textTracks = Array.from(media.textTracks ?? []);
      textTracks.forEach((track, index) => {
        track.mode = index === active ? 'showing' : 'hidden';
      });
    });

    // progressive quality ladder → store
    effect(() => {
      const levels = this.progressiveLevels();
      if (!this.engineActive()) {
        this.state.levels.set(levels);
        if (levels.length) this.qualityLevels.emit(levels);
      }
    });

    // quality switch preserves position; content swap (playlist) restarts from 0
    effect(() => {
      const contentKey = this.parsedSources()
        .map((source) => source.src)
        .join('|');
      this.renderedSources();

      untracked(() => {
        const contentChanged = contentKey !== this.#lastContentKey;
        this.#lastContentKey = contentKey;
        this.#reload(contentChanged);
      });
    });

    // engine lifecycle — the HLS/MSE engine is a separate entry point loaded
    // on demand, so plain-mp4 consumers never download it
    effect(() => {
      const media = this.mediaRef()?.nativeElement;
      const sources = this.parsedSources();
      const useEngine = this.engineActive();

      untracked(() => {
        this.#destroyEngine();
        if (!useEngine || !media || !this.#isBrowser || !sources.length) return;

        const generation = ++this.#engineGeneration;
        void import('@ship-ui/core/ship-video/engine').then(({ createShipVideoEngine }) => {
          const engine = createShipVideoEngine(sources[0].src);
          if (!engine) return;
          if (generation !== this.#engineGeneration || media !== this.mediaRef()?.nativeElement) {
            engine.destroy();
            return;
          }

          this.#attachEngine(engine, media, sources[0].src);
        });
      });
    });

    this.#engineSelectionEffects();
  }

  #attachEngine(engine: ShipVideoEngine, media: HTMLVideoElement, src: string) {
    this.#engine = engine;
    this.#engineUnsubscribers.push(
      engine.subscribe((engineState) => {
        this.state.levels.set(engineState.levels);
        this.state.activeLevel.set(engineState.currentLevel);
        this.state.subtitleTracks.set(engineState.subtitleTracks);
        this.state.audioTracks.set(engineState.audioTracks);
        this.state.isLive.set(engineState.isLive);
        this.state.atLiveEdge.set(engineState.atLiveEdge);
        this.state.dvrWindow.set(engineState.dvrWindow);
        this.state.latency.set(engineState.latency);
        this.state.stalled.set(engineState.stalled);
        if (engineState.storyboard) this.state.storyboard.set(engineState.storyboard);
      }),
      engine.on((event) => {
        if (event.type === 'manifest-parsed') this.qualityLevels.emit(engine.getState().levels);
        if (event.type === 'error') this.videoError.emit(event.error);
        if (event.type === 'ended') this.onMainEnded();
      })
    );
    engine.load(media, src);

    // apply selections that may have been made while the engine was loading
    const quality = this.state.quality();
    if (quality !== 'auto') engine.setLevel(quality);
    const textTrack = this.state.textTrack();
    if (textTrack !== null) engine.setSubtitleTrack(textTrack);
    const audioTrack = this.state.audioTrack();
    if (audioTrack !== null) engine.setAudioTrack(audioTrack);
  }

  #engineSelectionEffects() {
    effect(() => {
      const quality = this.state.quality();
      untracked(() => this.#engine?.setLevel(quality === 'auto' ? -1 : quality));
    });

    effect(() => {
      const track = this.state.textTrack();
      untracked(() => this.#engine?.setSubtitleTrack(track ?? -1));
    });

    effect(() => {
      const track = this.state.audioTrack();
      untracked(() => {
        if (track !== null) this.#engine?.setAudioTrack(track);
      });
    });

    // remote playback availability: WebKit AirPlay on Apple platforms, Remote
    // Playback API (Chromecast) elsewhere. Never both — on WebKit they are the
    // same targets and would render two near-identical buttons. Everything is
    // guarded: a throwing platform API must never break change detection.
    effect((onCleanup) => {
      const media = this.mediaRef()?.nativeElement;
      if (!media || !this.#isBrowser) return;

      const hasWebkitAirplay = typeof (window as WebKitWindow).WebKitPlaybackTargetAvailabilityEvent !== 'undefined';

      if (hasWebkitAirplay) {
        try {
          const webkitMedia = media as WebKitVideoElement;
          const onAvailability = (event: Event) =>
            this.state.airplayAvailable.set((event as { availability?: string }).availability === 'available');
          const onWireless = () => this.state.casting.set(!!webkitMedia.webkitCurrentPlaybackTargetIsWireless);

          media.addEventListener('webkitplaybacktargetavailabilitychanged', onAvailability);
          media.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', onWireless);

          onCleanup(() => {
            media.removeEventListener('webkitplaybacktargetavailabilitychanged', onAvailability);
            media.removeEventListener('webkitcurrentplaybacktargetiswirelesschanged', onWireless);
          });
        } catch {
          this.state.airplayAvailable.set(false);
        }
        return;
      }

      try {
        const remote = (media as HTMLVideoElement & { remote?: RemotePlaybackLike }).remote;
        if (!remote?.watchAvailability) return;

        let watchId: number | null = null;
        remote
          .watchAvailability((available) => this.state.castAvailable.set(available))
          .then((id) => (watchId = id))
          .catch(() => this.state.castAvailable.set(false));

        const onConnect = () => this.state.casting.set(true);
        const onDisconnect = () => this.state.casting.set(false);
        remote.addEventListener('connect', onConnect);
        remote.addEventListener('disconnect', onDisconnect);

        onCleanup(() => {
          try {
            remote.removeEventListener('connect', onConnect);
            remote.removeEventListener('disconnect', onDisconnect);
            if (watchId !== null) remote.cancelWatchAvailability?.(watchId)?.catch?.(() => {});
          } catch {
            // ignore teardown failures
          }
        });
      } catch {
        this.state.castAvailable.set(false);
      }
    });
  }

  /** Opens the Chromecast/remote-playback device picker. */
  requestCast() {
    const media = this.mediaRef()?.nativeElement as (HTMLVideoElement & { remote?: RemotePlaybackLike }) | undefined;
    media?.remote?.prompt?.().catch(() => {});
  }

  /** Opens Safari's AirPlay target picker. */
  requestAirplay() {
    (this.mediaRef()?.nativeElement as WebKitVideoElement | undefined)?.webkitShowPlaybackTargetPicker?.();
  }

  ngAfterViewInit() {
    if (!this.#isBrowser) return;

    if (!this.lazy() || typeof IntersectionObserver === 'undefined') {
      this.activated.set(true);
      return;
    }

    this.#intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.activated.set(true);
          this.#intersectionObserver?.disconnect();
          this.#intersectionObserver = null;
        }
      },
      { rootMargin: '200px' }
    );
    this.#intersectionObserver.observe(this.#selfRef.nativeElement);
  }

  /** Starts playback for the first time; runs the pre-roll ad when configured. */
  start() {
    if (this.state.hasStarted() || !this.#isBrowser) return;

    this.activated.set(true);
    this.state.hasStarted.set(true);
    this.#rewindSlate();
    this.videoStarted.emit();

    const ad = this.activeAd();
    if (ad && !this.#adCompleted) {
      // play+pause inside the user gesture so the content element keeps
      // playback permission for the gesture-less play() after the ad
      this.#unlockMainPlayback();
      this.#beginAd(ad);
      return;
    }

    this.#playMain();
  }

  /**
   * YouTube-style auto slate: sample a few candidate frames, score each by
   * luma variance on a tiny canvas (fog/black/flat frames score low), park on
   * the most detailed one. Requires CORS-readable media — on a tainted canvas
   * the initial ~10% frame is kept. Aborts as soon as playback starts.
   */
  async #refineSlate(media: HTMLVideoElement, duration: number) {
    if (!isFinite(duration) || duration <= 0) return;

    const candidates = [...new Set(
      [0.1, 0.25, 0.4, 0.6].map((fraction) => Math.round(Math.min(fraction * duration, 90) * 10) / 10)
    )];

    const canvas = this.#document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 36;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    let best = { time: this.#appliedSlateTime, score: -1 };

    for (const candidate of candidates) {
      if (this.#destroyed || !this.#slateApplied || this.state.hasStarted()) return;

      await this.#seekAndWait(media, candidate);
      if (this.#destroyed || !this.#slateApplied || this.state.hasStarted()) return;

      let pixels: Uint8ClampedArray;
      try {
        context.drawImage(media, 0, 0, canvas.width, canvas.height);
        pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      } catch {
        return; // cross-origin media without CORS — keep the current frame
      }

      const score = this.#frameDetailScore(pixels);
      if (score > best.score) best = { time: candidate, score };
    }

    if (this.#destroyed || !this.#slateApplied || this.state.hasStarted()) return;
    await this.#seekAndWait(media, best.time);
  }

  /** Standard deviation of luma — flat frames (black, fog, single colour) score near 0. */
  #frameDetailScore(pixels: Uint8ClampedArray): number {
    let sum = 0;
    let squares = 0;
    const count = pixels.length / 4;
    for (let index = 0; index < pixels.length; index += 4) {
      const luma = 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2];
      sum += luma;
      squares += luma * luma;
    }
    const mean = sum / count;
    return Math.sqrt(Math.max(0, squares / count - mean * mean));
  }

  #seekAndWait(media: HTMLVideoElement, time: number): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        media.removeEventListener('seeked', done);
        clearTimeout(timeout);
        resolve();
      };
      const timeout = setTimeout(done, 1500);
      media.addEventListener('seeked', done);
      this.#appliedSlateTime = time;
      media.currentTime = time;
    });
  }

  /** The slate seek was only for the featured frame — play from the beginning. */
  #rewindSlate() {
    if (!this.#slateApplied) return;
    this.#slateApplied = false;

    const media = this.mediaRef()?.nativeElement;
    if (!media) return;

    // rewind while parked on the slate frame; also never begin playback from
    // the media's end (a clamped slate) — that fires 'ended' immediately
    const onSlate = Math.abs(media.currentTime - this.#appliedSlateTime) < 0.25;
    const atEnd = isFinite(media.duration) && media.duration > 0 && media.currentTime >= media.duration - 0.5;
    if (onSlate || atEnd) {
      media.currentTime = 0;
      this.state.currentTime.set(0);
    }
  }

  #unlockMainPlayback() {
    const media = this.mediaRef()?.nativeElement;
    if (!media) return;

    this.#unlocking = true;
    const result = media.play();
    if (result && typeof result.then === 'function') {
      result
        .then(() => {
          if (this.#unlocking) media.pause();
          this.#unlocking = false;
        })
        .catch(() => (this.#unlocking = false));
    } else {
      media.pause();
      this.#unlocking = false;
    }
  }

  /** Ends the ad phase (skipped or completed) and starts the content video. */
  finishAd(skipped: boolean) {
    if (!this.state.adActive()) return;

    // order matters: drop the ad phase first so the ad element's pause event
    // can no longer write playing=false and stall the content hand-off
    this.state.adActive.set(false);
    this.adMediaRef()?.nativeElement?.pause();
    this.state.adCreative.set(null);
    this.state.adCurrentTime.set(0);
    this.state.adDuration.set(0);
    this.#adCompleted = true;

    if (skipped) this.adSkipped.emit();
    this.adEnded.emit();

    this.state.playing.set(true);
    this.#playMain();
  }

  onSurfaceClick() {
    if (!this.interactive()) return;

    // touch: tapping the surface toggles the control overlay (YouTube-mobile
    // behaviour) — play/pause happens via the buttons. Mouse keeps click-to-play.
    // Uses the pre-tap visibility (pointerdown already woke the bar).
    if (this.#lastPointerWasTouch && this.state.hasStarted()) {
      if (this.#controlsVisibleAtPointerDown) {
        this.sleepControls();
      } else {
        this.wakeControls();
      }
      return;
    }

    this.state.togglePlay();
    this.wakeControls();
  }

  seekTo(seconds: number, options?: { precise?: boolean }) {
    if (this.state.adActive()) return;

    const media = this.mediaRef()?.nativeElement;
    if (!media) return;

    const dvr = this.state.dvrWindow();
    const max = dvr ? dvr.end : this.state.duration() || media.duration || 0;
    const min = dvr ? dvr.start : 0;
    const clamped = Math.max(min, Math.min(max, seconds));

    // currentTime is frame-accurate; fastSeek would trade accuracy for speed.
    media.currentTime = clamped;
    this.state.currentTime.set(clamped);

    if (options?.precise) this.state.seeking.set(true);
  }

  /** Frame stepping; pauses playback. Frame duration measured from rVFC deltas. */
  step(frames: number) {
    const media = this.mediaRef()?.nativeElement;
    if (!media) return;

    media.pause();
    this.seekTo(media.currentTime + frames * this.#lastFrameDuration, { precise: true });
  }

  /** `requestVideoFrameCallback` passthrough; returns an unsubscribe function. */
  onVideoFrame(callback: (time: number) => void): () => void {
    this.#frameCallbacks.add(callback);
    this.#ensureFrameLoop();
    return () => this.#frameCallbacks.delete(callback);
  }

  goToLive() {
    if (this.#engine) {
      this.#engine.seekToLiveEdge();
      return;
    }

    const media = this.mediaRef()?.nativeElement;
    if (media && media.seekable.length) {
      media.currentTime = media.seekable.end(media.seekable.length - 1);
    }
  }

  toggleFullscreen() {
    if (!this.#isBrowser) return;

    if (this.#document.fullscreenElement) {
      this.#document.exitFullscreen?.().catch(() => {});
      return;
    }

    if (this.#selfRef.nativeElement.requestFullscreen) {
      this.#selfRef.nativeElement.requestFullscreen().catch(() => {});
      return;
    }

    // iPhone Safari: no element fullscreen — use the native video fullscreen
    const media = this.mediaRef()?.nativeElement as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | undefined;
    try {
      media?.webkitEnterFullscreen?.();
    } catch {
      // not ready yet (no video data) — ignore
    }
  }

  togglePip() {
    if (!this.#isBrowser) return;

    const media = this.mediaRef()?.nativeElement as
      | (HTMLVideoElement & {
          requestPictureInPicture?: () => Promise<unknown>;
          webkitSupportsPresentationMode?: (mode: string) => boolean;
          webkitSetPresentationMode?: (mode: string) => void;
          webkitPresentationMode?: string;
        })
      | undefined;
    if (!media) return;

    const doc = this.#document as Document & { exitPictureInPicture?: () => Promise<void>; pictureInPictureElement?: Element };
    try {
      if (doc.pictureInPictureElement) {
        doc.exitPictureInPicture?.().catch(() => {});
      } else if (media.requestPictureInPicture) {
        media.requestPictureInPicture().catch(() => {});
      } else if (media.webkitSupportsPresentationMode?.('picture-in-picture')) {
        // Safari's presentation-mode API (incl. iPhone)
        media.webkitSetPresentationMode?.(
          media.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture'
        );
      }
    } catch {
      // PiP unavailable in this state — ignore
    }
  }

  syncFullscreenState() {
    this.state.isFullscreen.set(this.#document.fullscreenElement === this.#selfRef.nativeElement);
  }

  syncVisibility() {
    this.#engine?.setVisibility(this.#document.visibilityState !== 'hidden');
  }

  onKeydown(event: KeyboardEvent) {
    this.#lastInputWasKeyboard = true;
    if (!this.interactive()) return;

    const target = event.target as HTMLElement;
    if (target.closest('input, a, sh-menu, .sh-video-ad-skip')) return;

    switch (event.key) {
      case ' ':
      case 'k':
        event.preventDefault();
        this.state.togglePlay();
        break;
      case 'm':
        this.state.toggleMute();
        break;
      case 'f':
        this.toggleFullscreen();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.seekTo(this.state.currentTime() - 5);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.seekTo(this.state.currentTime() + 5);
        break;
      case 'j':
        this.seekTo(this.state.currentTime() - 10);
        break;
      case 'l':
        this.seekTo(this.state.currentTime() + 10);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.state.volume.set(Math.min(1, this.state.volume() + 0.1));
        this.state.muted.set(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.state.volume.set(Math.max(0, this.state.volume() - 0.1));
        break;
    }

    this.wakeControls();
  }

  onHostPointerDown(event: PointerEvent) {
    this.#lastPointerWasTouch = event.pointerType === 'touch' || event.pointerType === 'pen';
    this.#lastInputWasKeyboard = false;

    // snapshot for the surface-tap toggle, then keep the bar alive while a
    // finger is interacting — it must never fade mid-press
    this.#controlsVisibleAtPointerDown = this.state.controlsVisible();
    if (this.state.hasStarted()) this.wakeControls();
  }

  wakeControls() {
    this.state.controlsVisible.set(true);

    if (!this.#isBrowser) return;
    if (this.#idleTimer) clearTimeout(this.#idleTimer);

    // touch gets longer: no hover means every interaction restarts from a tap
    const idleTimeout = this.#lastPointerWasTouch ? CONTROLS_IDLE_TIMEOUT_TOUCH : CONTROLS_IDLE_TIMEOUT;
    this.#idleTimer = setTimeout(() => {
      // keyboard users keep their controls while focused; pointer-origin
      // focus (host has tabindex) must not block the idle fade
      const keyboardFocused = this.#lastInputWasKeyboard && this.#selfRef.nativeElement.matches(':focus-within');
      if (this.state.playing() && !keyboardFocused) {
        this.state.controlsVisible.set(false);
      }
    }, CONTROLS_IDLE_TIMEOUT);
  }

  sleepControls() {
    if (this.#idleTimer) clearTimeout(this.#idleTimer);
    if (this.state.playing()) this.state.controlsVisible.set(false);
  }

  warmUp() {
    if (this.preload() === 'metadata') this.warmedUp.set(true);
  }

  onMainPlay() {
    if (this.state.adActive() || this.#unlocking) return;
    this.state.playing.set(true);
    this.videoPlayed.emit();
    this.#ensureFrameLoop();
  }

  onMainPause() {
    if (this.state.adActive() || this.#unlocking) return;
    this.state.playing.set(false);
    this.videoPaused.emit();
  }

  onMainEnded() {
    this.state.playing.set(false);
    this.#clearResume();
    this.videoEnded.emit();
  }

  onMainTimeUpdate() {
    const media = this.mediaRef()?.nativeElement;
    if (!media) return;

    // parked on the slate frame pre-start: keep the UI at 0:00
    if (this.#slateApplied && !this.state.hasStarted()) return;

    this.state.currentTime.set(media.currentTime);
    this.videoTimeUpdated.emit(media.currentTime);
    this.#saveResume(media.currentTime);
  }

  onMainLoadedMetadata() {
    const media = this.mediaRef()?.nativeElement;
    if (!media) return;

    this.state.duration.set(isFinite(media.duration) ? media.duration : 0);
    if (!this.engineActive() && !isFinite(media.duration)) this.state.isLive.set(true);

    // fragment-delivered slate (#t= in the source URL): the browser already
    // parked the playhead there — just claim it so the clock stays at 0:00
    // and start() rewinds to the beginning
    const fragment = this.slateFragmentTime();
    if (fragment !== null && !this.state.hasStarted()) {
      const duration = media.duration;
      if (isFinite(duration) && fragment >= duration - 0.5) {
        // fragment beyond this media's end (e.g. slate time outliving a
        // playlist swap) — parked at the end, play() would fire 'ended'
        // instantly; reposition to a sane in-range slate
        this.#appliedSlateTime = this.#slateTimeFor(duration);
        this.#slateApplied = true;
        media.currentTime = this.#appliedSlateTime;
        this.state.currentTime.set(0);
        this.#restoreResume(media);
        return;
      }
      if (Math.abs(media.currentTime - fragment) < 1) {
        this.#appliedSlateTime = media.currentTime;
        this.#slateApplied = true;
        this.state.currentTime.set(0);
        this.#restoreResume(media);
        return;
      }
    }

    // metadata alone may not decode a frame — a seek forces the browser to
    // paint the slate frame behind the transparent featured overlay
    if (this.firstFrameEnabled() && !this.state.hasStarted() && media.currentTime === 0) {
      this.#appliedSlateTime = this.#slateTimeFor(media.duration);
      media.currentTime = this.#appliedSlateTime;
      this.#slateApplied = true;

      // auto mode: refine towards the most detailed candidate frame, then bake
      // the result into a #t= media fragment so iOS Safari paints it too
      if (typeof this.firstFrame() !== 'number' && !this.engineActive()) {
        void this.#refineSlate(media, media.duration).then(() => {
          if (this.#destroyed || !this.#slateApplied || this.state.hasStarted()) return;
          if (this.slateFragmentTime() === null) {
            this.slateFragmentTime.set(Math.round(this.#appliedSlateTime * 10) / 10);
          }
        });
      }
    }

    this.#restoreResume(media);
  }

  onMainProgress() {
    const media = this.mediaRef()?.nativeElement;
    if (!media) return;

    const ranges: { start: number; end: number }[] = [];
    for (let index = 0; index < media.buffered.length; index++) {
      ranges.push({ start: media.buffered.start(index), end: media.buffered.end(index) });
    }
    this.state.bufferedRanges.set(ranges);
  }

  onMainError() {
    const media = this.mediaRef()?.nativeElement;
    this.videoError.emit({
      fatal: true,
      type: 'media',
      code: 'segment-load',
      detail: media?.error?.message ?? 'Media element error',
    });
  }

  onAdPlay() {
    if (this.state.adActive()) this.state.playing.set(true);
  }

  onAdPause() {
    if (this.state.adActive()) this.state.playing.set(false);
  }

  onAdTimeUpdate() {
    const adMedia = this.adMediaRef()?.nativeElement;
    if (adMedia) this.state.adCurrentTime.set(adMedia.currentTime);
  }

  onAdLoadedMetadata() {
    const adMedia = this.adMediaRef()?.nativeElement;
    if (adMedia) this.state.adDuration.set(isFinite(adMedia.duration) ? adMedia.duration : 0);
  }

  async #beginAd(ad: ShipVideoAd) {
    const token = ++this.#adResolveToken;

    let creative: ShipVideoAdCreative | null = null;
    if (typeof ad === 'function') {
      try {
        creative = await Promise.race([
          ad(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), AD_RESOLVE_TIMEOUT)),
        ]);
      } catch {
        creative = null;
      }
    } else {
      creative = ad;
    }

    if (token !== this.#adResolveToken) return;

    if (!creative) {
      this.#adCompleted = true;
      this.#playMain();
      return;
    }

    this.state.adCreative.set(creative);
    this.state.adActive.set(true);
    this.adStarted.emit();
  }

  #playMain() {
    this.#unlocking = false;
    const media = this.mediaRef()?.nativeElement;
    if (media) this.#safePlay(media);
  }

  #reload(contentChanged: boolean) {
    const media = this.mediaRef()?.nativeElement;
    if (!media || !this.#isBrowser || this.engineActive()) return;

    const wasStarted = this.state.hasStarted();
    const position = media.currentTime;
    const wasPlaying = !media.paused;

    if (contentChanged) {
      this.state.currentTime.set(0);
      this.state.duration.set(0);
      this.state.bufferedRanges.set([]);
      this.#restoredResume = false;
      // new content gets a fresh slate — a stale #t= from the previous item
      // could point past the new duration (instant 'ended' → auto-advance skip).
      // Explicit firstFrame re-arms immediately; metadata re-clamps misfits.
      this.#slateApplied = false;
      const explicit = this.firstFrame();
      this.slateFragmentTime.set(
        typeof explicit === 'number' && !this.activePoster() && !this.engineActive()
          ? Math.max(0.001, explicit)
          : null
      );
    }

    media.load();

    if (!wasStarted) return;

    if (!contentChanged && position > 0) {
      const restore = () => {
        media.currentTime = position;
        if (wasPlaying) this.#safePlay(media);
        media.removeEventListener('loadedmetadata', restore);
      };
      media.addEventListener('loadedmetadata', restore);
      return;
    }

    // new content: run its pre-roll if configured, else keep playing
    const ad = this.activeAd();
    if (ad && !this.#adCompleted) {
      this.#beginAd(ad);
    } else if (wasPlaying || contentChanged) {
      this.#safePlay(media);
    }
  }

  #ensureFrameLoop() {
    const media = this.mediaRef()?.nativeElement as
      | (HTMLVideoElement & {
          requestVideoFrameCallback?: (cb: (now: number, metadata: { mediaTime: number }) => void) => number;
          cancelVideoFrameCallback?: (handle: number) => void;
        })
      | undefined;

    if (!media?.requestVideoFrameCallback || this.#frameCallbackHandle !== null) return;

    const loop = (_now: number, metadata: { mediaTime: number }) => {
      this.#frameCallbackHandle = null;
      if (this.#destroyed) return;

      const delta = metadata.mediaTime - this.#lastFrameMediaTime;
      if (delta > 0 && delta < 0.25) this.#lastFrameDuration = delta;
      this.#lastFrameMediaTime = metadata.mediaTime;

      if (!this.state.adActive()) this.state.currentTime.set(metadata.mediaTime);
      for (const callback of this.#frameCallbacks) callback(metadata.mediaTime);

      if (this.state.playing() || this.#frameCallbacks.size) {
        this.#frameCallbackHandle = media.requestVideoFrameCallback!(loop);
      }
    };

    this.#frameCallbackHandle = media.requestVideoFrameCallback(loop);
  }

  #restoreResume(media: HTMLVideoElement) {
    const key = this.resumeKey();
    if (!key || this.#restoredResume || !this.#isBrowser) return;
    this.#restoredResume = true;

    try {
      const stored = parseFloat(localStorage.getItem(`sh-video:${key}`) ?? '');
      const duration = media.duration;
      if (!isNaN(stored) && isFinite(duration) && stored > RESUME_MIN_SECONDS && stored < duration * 0.9) {
        media.currentTime = stored;
        this.state.currentTime.set(stored);
        this.#slateApplied = false;
      }
    } catch {
      // localStorage unavailable (private mode) — resume silently disabled
    }
  }

  #saveResume(currentTime: number) {
    const key = this.resumeKey();
    if (!key || !this.#isBrowser) return;
    if (Math.abs(currentTime - this.#lastResumeSave) < RESUME_SAVE_INTERVAL) return;

    this.#lastResumeSave = currentTime;
    try {
      localStorage.setItem(`sh-video:${key}`, String(currentTime));
    } catch {
      // ignore quota/private-mode failures
    }
  }

  #clearResume() {
    const key = this.resumeKey();
    if (!key || !this.#isBrowser) return;
    try {
      localStorage.removeItem(`sh-video:${key}`);
    } catch {
      // ignore
    }
  }

  #activeMedia(): HTMLVideoElement | null {
    if (this.state.adActive()) return this.adMediaRef()?.nativeElement ?? null;
    return this.mediaRef()?.nativeElement ?? null;
  }

  #mediaElements(): HTMLVideoElement[] {
    const elements: HTMLVideoElement[] = [];
    const media = this.mediaRef()?.nativeElement;
    const adMedia = this.adMediaRef()?.nativeElement;
    if (media) elements.push(media);
    if (adMedia) elements.push(adMedia);
    return elements;
  }

  #safePlay(media: HTMLVideoElement) {
    const result = media.play();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  }

  #destroyEngine() {
    this.#engineGeneration++;
    for (const unsubscribe of this.#engineUnsubscribers) unsubscribe();
    this.#engineUnsubscribers = [];
    this.#engine?.destroy();
    this.#engine = null;
  }

  ngOnDestroy() {
    this.#destroyed = true;
    if (this.#idleTimer) clearTimeout(this.#idleTimer);
    this.#intersectionObserver?.disconnect();

    // cancel the pending rVFC — on a detached element it may never fire again,
    // pinning the component + media element in memory
    const media = this.mediaRef()?.nativeElement as
      | (HTMLVideoElement & { cancelVideoFrameCallback?: (handle: number) => void })
      | undefined;
    if (this.#frameCallbackHandle !== null && media?.cancelVideoFrameCallback) {
      media.cancelVideoFrameCallback(this.#frameCallbackHandle);
      this.#frameCallbackHandle = null;
    }
    this.#frameCallbacks.clear();

    this.#destroyEngine();
    this.state.detachPlayer(this.#hooks);
  }
}
