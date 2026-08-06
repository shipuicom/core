import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipVideoScrubber } from './ship-video-scrubber';
import { ShipVideoSettings } from './ship-video-settings';
import { ShipVideoState } from './ship-video-state';
import { shipVideoFormatTime } from './ship-video-types';

@Component({
  selector: 'sh-video-play-button',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control' },
  template: `
    <button
      type="button"
      class="sh-video-control-button"
      [attr.aria-label]="state.playing() ? 'Pause' : 'Play'"
      (click)="state.togglePlay()">
      <sh-icon>{{ state.playing() ? 'pause-fill' : 'play-fill' }}</sh-icon>
    </button>
  `,
})
export class ShipVideoPlayButton {
  state = inject(ShipVideoState);
}

@Component({
  selector: 'sh-video-volume',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control sh-video-volume' },
  template: `
    <button
      type="button"
      class="sh-video-control-button"
      [attr.aria-label]="state.muted() ? 'Unmute' : 'Mute'"
      [attr.aria-pressed]="state.muted()"
      (click)="state.toggleMute()">
      <sh-icon>{{ volumeIcon() }}</sh-icon>
    </button>

    <input
      class="sh-video-volume-slider"
      type="range"
      aria-label="Volume"
      min="0"
      max="1"
      step="0.05"
      [value]="state.muted() ? 0 : state.volume()"
      (input)="onVolumeInput($event)" />
  `,
})
export class ShipVideoVolume {
  state = inject(ShipVideoState);

  volumeIcon = computed(() => {
    if (this.state.muted() || this.state.volume() === 0) return 'speaker-x-fill';
    return this.state.volume() < 0.5 ? 'speaker-low-fill' : 'speaker-high-fill';
  });

  onVolumeInput(event: Event) {
    const volume = parseFloat((event.target as HTMLInputElement).value);
    if (isNaN(volume)) return;

    this.state.volume.set(Math.max(0, Math.min(1, volume)));
    this.state.muted.set(volume === 0);
  }
}

@Component({
  selector: 'sh-video-time',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control sh-video-time' },
  template: `
    @if (state.adActive()) {
      <span class="sh-video-time-current">{{ formatTime(state.adCurrentTime()) }}</span>
      <span class="sh-video-time-divider">/</span>
      <span class="sh-video-time-duration">{{ formatTime(state.adDuration()) }}</span>
    } @else if (state.isLive()) {
      @if (behindLive(); as behind) {
        <span class="sh-video-time-behind">-{{ behind }}</span>
      }
    } @else {
      <span class="sh-video-time-current">{{ formatTime(state.currentTime()) }}</span>
      <span class="sh-video-time-divider">/</span>
      <span class="sh-video-time-duration">{{ formatTime(state.duration()) }}</span>
    }
  `,
})
export class ShipVideoTime {
  state = inject(ShipVideoState);
  formatTime = shipVideoFormatTime;

  behindLive = computed(() => {
    const latency = this.state.latency();
    if (latency === null || this.state.atLiveEdge()) return null;
    return shipVideoFormatTime(latency);
  });
}

/**
 * X/Twitter-style countdown pill showing time remaining — an alternative to
 * `sh-video-time`. Counts down the ad while one plays.
 */
@Component({
  selector: 'sh-video-playtime-left',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control sh-video-playtime-left' },
  template: `
    @if (remainingLabel(); as label) {
      <span class="sh-video-playtime-left-pill">{{ label }}</span>
    }
  `,
})
export class ShipVideoPlaytimeLeft {
  state = inject(ShipVideoState);

  remainingLabel = computed(() => {
    const duration = this.state.adActive() ? this.state.adDuration() : this.state.duration();
    const current = this.state.adActive() ? this.state.adCurrentTime() : this.state.currentTime();
    if (this.state.isLive() || duration <= 0) return null;
    return shipVideoFormatTime(Math.max(0, duration - current));
  });
}

@Component({
  selector: 'sh-video-live-button',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control' },
  template: `
    <button
      type="button"
      class="sh-video-live-badge"
      [class.at-edge]="state.atLiveEdge()"
      aria-label="Go to live"
      (click)="state.goToLive()">
      <span class="sh-video-live-dot"></span>
      LIVE
    </button>
  `,
})
export class ShipVideoLiveButton {
  state = inject(ShipVideoState);
}

@Component({
  selector: 'sh-video-captions-button',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control' },
  template: `
    <button
      type="button"
      class="sh-video-control-button"
      [class.active]="state.textTrack() !== null"
      aria-label="Subtitles"
      [attr.aria-pressed]="state.textTrack() !== null"
      (click)="toggle()">
      <sh-icon>subtitles-fill</sh-icon>
    </button>
  `,
})
export class ShipVideoCaptionsButton {
  state = inject(ShipVideoState);
  #lastTrack = 0;

  toggle() {
    const current = this.state.textTrack();
    if (current !== null) {
      this.#lastTrack = current;
      this.state.textTrack.set(null);
    } else {
      const tracks = this.state.subtitleTracks();
      if (!tracks.length) return;
      const fallback = tracks.find((track) => track.default)?.id ?? tracks[0].id;
      this.state.textTrack.set(tracks.some((track) => track.id === this.#lastTrack) ? this.#lastTrack : fallback);
    }
  }
}

/**
 * Chromecast/remote-device button (Remote Playback API — Chrome/Edge).
 * Renders nothing when the browser has no remote device available.
 */
@Component({
  selector: 'sh-video-cast-button',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control' },
  template: `
    @if (state.castAvailable()) {
      <button
        type="button"
        class="sh-video-control-button"
        [class.active]="state.casting()"
        aria-label="Cast to device"
        [attr.aria-pressed]="state.casting()"
        (click)="state.requestCast()">
        <sh-icon>screencast</sh-icon>
      </button>
    }
  `,
})
export class ShipVideoCastButton {
  state = inject(ShipVideoState);
}

/**
 * AirPlay button (WebKit target picker — Safari).
 * Renders nothing when no wireless playback target is available.
 */
@Component({
  selector: 'sh-video-airplay-button',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control' },
  template: `
    @if (state.airplayAvailable()) {
      <button
        type="button"
        class="sh-video-control-button"
        [class.active]="state.casting()"
        aria-label="AirPlay"
        [attr.aria-pressed]="state.casting()"
        (click)="state.requestAirplay()">
        <sh-icon>airplay</sh-icon>
      </button>
    }
  `,
})
export class ShipVideoAirplayButton {
  state = inject(ShipVideoState);
}

@Component({
  selector: 'sh-video-pip-button',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control' },
  template: `
    <button
      type="button"
      class="sh-video-control-button"
      [attr.aria-label]="state.isPip() ? 'Exit picture in picture' : 'Picture in picture'"
      [attr.aria-pressed]="state.isPip()"
      (click)="state.togglePip()">
      <sh-icon>picture-in-picture-fill</sh-icon>
    </button>
  `,
})
export class ShipVideoPipButton {
  state = inject(ShipVideoState);
}

@Component({
  selector: 'sh-video-fullscreen-button',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control' },
  template: `
    <button
      type="button"
      class="sh-video-control-button"
      [attr.aria-label]="state.isFullscreen() ? 'Exit fullscreen' : 'Fullscreen'"
      (click)="state.toggleFullscreen()">
      <sh-icon>{{ state.isFullscreen() ? 'corners-in' : 'corners-out' }}</sh-icon>
    </button>
  `,
})
export class ShipVideoFullscreenButton {
  state = inject(ShipVideoState);
}

/**
 * Control bar. Project composable children, or let `sh-video` render it with
 * `defaultLayout` for the batteries-included set.
 */
@Component({
  selector: 'sh-video-controls',
  encapsulation: ViewEncapsulation.None,
  imports: [
    ShipVideoScrubber,
    ShipVideoSettings,
    ShipVideoPlayButton,
    ShipVideoVolume,
    ShipVideoTime,
    ShipVideoLiveButton,
    ShipVideoCaptionsButton,
    ShipVideoCastButton,
    ShipVideoAirplayButton,
    ShipVideoPipButton,
    ShipVideoFullscreenButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-controls' },
  template: `
    @if (defaultLayout()) {
      <sh-video-scrubber />

      <sh-video-play-button />
      <sh-video-volume />
      <sh-video-time />
      @if (state.isLive()) {
        <sh-video-live-button />
      }

      <span class="sh-video-spacer"></span>

      @if (state.subtitleTracks().length) {
        <sh-video-captions-button />
      }
      <sh-video-settings />
      <sh-video-cast-button />
      <sh-video-airplay-button />
      <sh-video-pip-button />
      <sh-video-fullscreen-button />
    } @else {
      <ng-content />
    }
  `,
})
export class ShipVideoControls {
  state = inject(ShipVideoState);

  /** Renders the full default control set instead of projected content. */
  defaultLayout = input(false);
}
