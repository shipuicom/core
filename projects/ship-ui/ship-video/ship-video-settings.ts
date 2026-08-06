import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipMenu } from '@ship-ui/core/ship-menu';
import { ShipVideoState } from './ship-video-state';

/**
 * Gear menu: quality (Auto + ladder), speed and subtitles, auto-populated from
 * `ShipVideoState`. Sections without options hide themselves.
 */
@Component({
  selector: 'sh-video-settings',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon, ShipMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'sh-video-control sh-video-settings' },
  template: `
    <sh-menu [searchable]="false" [openIndicator]="false">
      <button type="button" class="sh-video-control-button" aria-label="Settings">
        <sh-icon>gear-six-fill</sh-icon>
      </button>

      <ng-container menu>
        @if (state.levels().length) {
          <h3>Quality</h3>
          <button [class.selected]="state.quality() === 'auto'" (click)="state.quality.set('auto')">
            Auto
            @if (state.quality() === 'auto' && autoLevelLabel(); as label) {
              <span class="sh-video-settings-hint">{{ label }}</span>
            }
          </button>
          @for (level of state.levels(); track level.id) {
            <button [class.selected]="state.quality() === level.id" (click)="state.quality.set(level.id)">
              {{ level.label }}
            </button>
          }
        }

        <h3>Speed</h3>
        @for (rate of state.playbackRates(); track rate) {
          <button [class.selected]="state.playbackRate() === rate" (click)="state.playbackRate.set(rate)">
            {{ rate === 1 ? 'Normal' : rate + 'x' }}
          </button>
        }

        @if (state.audioTracks().length > 1) {
          <h3>Audio</h3>
          @for (track of state.audioTracks(); track track.id) {
            <button [class.selected]="state.audioTrack() === track.id || (state.audioTrack() === null && track.default)"
              (click)="state.audioTrack.set(track.id)">
              {{ track.name }}{{ track.lang ? ' (' + track.lang + ')' : '' }}
            </button>
          }
        }

        @if (state.subtitleTracks().length) {
          <h3>Subtitles</h3>
          <button [class.selected]="state.textTrack() === null" (click)="state.textTrack.set(null)">Off</button>
          @for (track of state.subtitleTracks(); track track.id) {
            <button [class.selected]="state.textTrack() === track.id" (click)="state.textTrack.set(track.id)">
              {{ track.name }}
            </button>
          }
        }
      </ng-container>
    </sh-menu>
  `,
})
export class ShipVideoSettings {
  state = inject(ShipVideoState);

  autoLevelLabel = computed(() => {
    const active = this.state.activeLevel();
    return this.state.levels().find((level) => level.id === active)?.label ?? null;
  });
}
