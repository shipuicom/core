import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { ShipVideoStoryboardCue } from './engine/types';
import { ShipVideoState } from './ship-video-state';
import { shipVideoFormatTime } from './ship-video-types';

/**
 * Seek bar: buffered ranges, drag-seek, hover time tooltip with optional
 * storyboard thumbnails, chapter/cut markers, DVR mode when live, and a
 * non-interactive warn-colored ad progress while an ad plays.
 */
@Component({
  selector: 'sh-video-scrubber',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'sh-video-scrubber',
    '[class.is-ad]': 'state.adActive()',
    'role': 'slider',
    'aria-label': 'Seek',
    '[attr.aria-valuemin]': 'rangeStart()',
    '[attr.aria-valuemax]': 'rangeEnd()',
    '[attr.aria-valuenow]': 'state.currentTime().toFixed(0)',
    '[attr.aria-valuetext]': 'ariaValueText()',
    '[attr.aria-disabled]': 'state.adActive() ? true : null',
    '[attr.tabindex]': 'state.adActive() ? null : 0',
    '(keydown)': 'onKeydown($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointerleave)': 'hoverFraction.set(null)',
  },
  template: `
    <div class="sh-video-scrubber-rail">
      @if (!state.adActive()) {
        @for (range of bufferedSegments(); track range.left) {
          <div class="sh-video-scrubber-buffered" [style.left.%]="range.left" [style.width.%]="range.width"></div>
        }
      }

      <div class="sh-video-scrubber-played" [style.width.%]="progressPercentage()"></div>

      @for (marker of markerPositions(); track marker.left) {
        <div class="sh-video-scrubber-marker" [style.left.%]="marker.left" [attr.title]="marker.label ?? null"></div>
      }
    </div>

    <div class="sh-video-scrubber-knob" [style.left.%]="progressPercentage()"></div>

    @if (hoverFraction() !== null && !state.adActive()) {
      <div class="sh-video-scrubber-preview" [style.left.%]="clampedHoverPercentage()">
        @if (hoverThumb(); as thumb) {
          <div
            class="sh-video-scrubber-thumb"
            [style.width.px]="thumb.w ?? 160"
            [style.height.px]="thumb.h ?? 90"
            [style.background-image]="'url(' + thumb.url + ')'"
            [style.background-position]="thumbPosition(thumb)"></div>
        }
        <div class="sh-video-scrubber-tooltip">{{ hoverLabel() }}</div>
      </div>
    }
  `,
})
export class ShipVideoScrubber {
  state = inject(ShipVideoState);
  #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  #scrubbing = false;

  /** Chapter/cut markers; falls back to `ShipVideoState.markers`. */
  markers = input<{ time: number; label?: string }[] | null>(null);
  /** WebVTT storyboard URL (sprite/thumbnail cues) for hover previews. */
  storyboard = input<string | null>(null);

  hoverFraction = signal<number | null>(null);

  loadStoryboardEffect = effect(() => {
    const url = this.storyboard();
    if (!url || !this.#isBrowser) return;

    // parser lives in the lazily loaded engine entry point
    Promise.all([fetch(url).then((response) => response.text()), import('@ship-ui/core/ship-video/engine')])
      .then(([text, { parseStoryboard }]) => this.state.storyboard.set(parseStoryboard(text, url)))
      .catch(() => {});
  });

  rangeStart = computed(() => this.state.dvrWindow()?.start ?? 0);
  rangeEnd = computed(() => {
    const dvr = this.state.dvrWindow();
    if (dvr) return dvr.end;
    return this.state.adActive() ? this.state.adDuration() : this.state.duration();
  });

  progressPercentage = computed(() => {
    const time = this.state.adActive() ? this.state.adCurrentTime() : this.state.currentTime();
    return this.#toPercent(time);
  });

  bufferedSegments = computed(() => {
    const span = this.rangeEnd() - this.rangeStart();
    if (span <= 0) return [];

    return this.state.bufferedRanges().map((range) => ({
      left: this.#toPercent(range.start),
      width: Math.max(0, this.#toPercent(range.end) - this.#toPercent(range.start)),
    }));
  });

  markerPositions = computed(() => {
    const markers = this.markers() ?? this.state.markers();
    return markers
      .map((marker) => ({ left: this.#toPercent(marker.time), label: marker.label }))
      .filter((marker) => marker.left >= 0 && marker.left <= 100);
  });

  clampedHoverPercentage = computed(() => Math.max(0, Math.min(100, (this.hoverFraction() ?? 0) * 100)));

  hoverTime = computed(() => {
    const fraction = this.hoverFraction();
    if (fraction === null) return null;
    return this.rangeStart() + fraction * (this.rangeEnd() - this.rangeStart());
  });

  hoverLabel = computed(() => {
    const time = this.hoverTime();
    if (time === null) return '';

    if (this.state.isLive()) {
      const behind = Math.max(0, this.rangeEnd() - time);
      return behind < 3 ? 'LIVE' : `-${shipVideoFormatTime(behind)}`;
    }

    return shipVideoFormatTime(time);
  });

  hoverThumb = computed<ShipVideoStoryboardCue | null>(() => {
    const time = this.hoverTime();
    const cues = this.state.storyboard();
    if (time === null || !cues?.length) return null;
    return cues.find((cue) => time >= cue.start && time < cue.end) ?? null;
  });

  ariaValueText = computed(() => {
    if (this.state.isLive()) {
      return this.state.atLiveEdge() ? 'Live' : `${shipVideoFormatTime(this.state.latency() ?? 0)} behind live`;
    }
    return `${shipVideoFormatTime(this.state.currentTime())} of ${shipVideoFormatTime(this.state.duration())}`;
  });

  thumbPosition(thumb: ShipVideoStoryboardCue): string {
    if (thumb.x == null || thumb.y == null) return 'center';
    return `-${thumb.x}px -${thumb.y}px`;
  }

  onPointerDown(event: PointerEvent) {
    if (this.state.adActive() || !this.state.interactive()) return;

    this.#scrubbing = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.#seekToPointer(event);
  }

  onPointerMove(event: PointerEvent) {
    this.hoverFraction.set(this.#pointerFraction(event));
    if (this.#scrubbing) this.#seekToPointer(event);
  }

  onPointerUp(event: PointerEvent) {
    if (!this.#scrubbing) return;

    this.#scrubbing = false;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  }

  onKeydown(event: KeyboardEvent) {
    if (this.state.adActive()) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.state.seekTo(this.state.currentTime() - 5);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.state.seekTo(this.state.currentTime() + 5);
        break;
      case 'Home':
        event.preventDefault();
        this.state.seekTo(this.rangeStart());
        break;
      case 'End':
        event.preventDefault();
        this.state.seekTo(this.rangeEnd());
        break;
    }
  }

  #toPercent(time: number): number {
    const start = this.rangeStart();
    const span = this.rangeEnd() - start;
    if (span <= 0) return 0;
    return Math.max(0, Math.min(100, ((time - start) / span) * 100));
  }

  #pointerFraction(event: PointerEvent): number {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  }

  #seekToPointer(event: PointerEvent) {
    const fraction = this.#pointerFraction(event);
    this.state.seekTo(this.rangeStart() + fraction * (this.rangeEnd() - this.rangeStart()));
  }
}
