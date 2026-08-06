import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { shipComponentClasses, ShipColor } from '@ship-ui/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipVideo } from './ship-video';
import { ShipVideoPlaylistItem, shipVideoToSourceArray } from './ship-video-types';

/**
 * YouTube-style "up next" list. Standalone (`items` + `itemSelected`), or bind
 * `[player]` to drive a `sh-video` instance: selection swaps its sources/poster,
 * `autoAdvance` moves to the next item when the video ends.
 */
@Component({
  selector: 'sh-video-playlist',
  styleUrl: './ship-video-playlist.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    'role': 'list',
  },
  template: `
    <div class="sh-video-playlist-header">
      <ng-content select="header" />
    </div>

    @for (item of items(); track item.sources; let index = $index) {
      <button
        type="button"
        role="listitem"
        class="sh-video-playlist-item"
        [class.active]="index === activeIndex()"
        [attr.aria-current]="index === activeIndex() ? 'true' : null"
        (click)="select(index)">
        <span class="sh-video-playlist-thumb">
          @if (item.poster) {
            <img [src]="item.poster" alt="" loading="lazy" decoding="async" />
          } @else {
            <sh-icon>play-fill</sh-icon>
          }
          @if (item.duration) {
            <span class="sh-video-playlist-duration">{{ item.duration }}</span>
          }
          @if (index === activeIndex()) {
            <span class="sh-video-playlist-now">
              <sh-icon size="small">play-fill</sh-icon>
            </span>
          }
        </span>

        <span class="sh-video-playlist-meta">
          <span class="sh-video-playlist-title">{{ item.title }}</span>
          @if (item.subtitle) {
            <span class="sh-video-playlist-subtitle">{{ item.subtitle }}</span>
          }
        </span>

        <span class="sh-video-playlist-index">{{ index + 1 }}</span>
      </button>
    }
  `,
})
export class ShipVideoPlaylist {
  items = input.required<ShipVideoPlaylistItem[]>();
  /** Optional player instance this playlist drives. */
  player = input<ShipVideo | null>(null);
  /** Advances to the next item when the bound player's video ends. */
  autoAdvance = input(false);
  activeIndex = model(0);

  itemSelected = output<{ item: ShipVideoPlaylistItem; index: number }>();

  /** Color theme of active item accents (`ShipColor`). */
  color = input<ShipColor | null>(null);
  /** When `true`, renders with sharp (non-rounded) corners. */
  sharp = input<boolean | undefined>(undefined);

  hostClasses = shipComponentClasses('videoPlaylist', {
    color: this.color,
    sharp: this.sharp,
  });

  activeItem = computed(() => this.items()[this.activeIndex()] ?? null);

  constructor() {
    // Drive the bound player: selection swaps its content via the shared store.
    effect(() => {
      const player = this.player();
      const item = this.activeItem();
      if (!player || !item) return;

      untracked(() => this.#loadIntoPlayer(player, item));
    });

    // Auto-advance on ended.
    effect((onCleanup) => {
      const player = this.player();
      if (!player || !this.autoAdvance()) return;

      const subscription = outputToObservable(player.videoEnded).subscribe(() => {
        const next = this.activeIndex() + 1;
        if (next < this.items().length) {
          this.activeIndex.set(next);
          this.itemSelected.emit({ item: this.items()[next], index: next });
        }
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  select(index: number) {
    if (index === this.activeIndex()) return;

    this.activeIndex.set(index);
    const item = this.items()[index];
    if (item) this.itemSelected.emit({ item, index });
  }

  #loadIntoPlayer(player: ShipVideo, item: ShipVideoPlaylistItem) {
    const wasStarted = player.state.hasStarted();
    player.playlistSources.set(shipVideoToSourceArray(item.sources));
    player.playlistPoster.set(item.poster ?? null);
    player.playlistAd.set(item.ad ?? null);
    player.playlistTracks.set(item.tracks ?? null);

    if (wasStarted) player.state.playing.set(true);
  }
}
