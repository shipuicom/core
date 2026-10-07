import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
  ViewEncapsulation,
  isDevMode,
} from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipLayoutRankingVariant } from '@ship-ui/core';

/**
 * Ranked list with proportional bars (top pages, top sellers, votes …).
 * Give the list a `max` (defaults to 100) and each `sh-lo-ranking-item` a
 * `value`; the item draws its bar as `value / max`. Item slots: an optional
 * `sh-avatar`/`sh-icon`/`[lead]`, the label (any other content) and a
 * `[detail]` on the right (the formatted number). Optional `h3` heading and
 * `[actions]` on the list.
 */
@Component({
  selector: 'sh-lo-ranking',
  styleUrl: './ship-ranking.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="head">
      <ng-content select="h2, h3, h4, [title]" />
      <div class="actions"><ng-content select="[actions]" /></div>
    </div>
    <div class="items" role="list"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutRanking {
  /** Value that fills an item's bar completely. Pass the largest item's value for a relative ranking. */
  max = input(100, { transform: numberAttribute });
  /** Bar color (`ShipColor`), defaults to primary. */
  color = input<ShipColor | null>(null);
  /** Visual variant: `type-b` draws the bar as a tinted background behind the whole row, `type-c` compact rows without bars (a dense leaderboard). Project default via `ShipConfig.layoutRanking.variant`. */
  variant = input<ShipLayoutRankingVariant | null>(null);

  hostClasses = shipComponentClasses('layoutRanking', { variant: this.variant, color: this.color });
}

/** One row of `sh-lo-ranking`. */
@Component({
  selector: 'sh-lo-ranking-item',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="row">
      <div class="lead"><ng-content select="sh-avatar, sh-icon, [lead]" /></div>
      <div class="label"><ng-content /></div>
      <div class="detail"><ng-content select="[detail]" /></div>
    </div>
    <div class="bar"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    '[style.--ranking-pct]': 'percent()',
  },
})
export class ShipLayoutRankingItem {
  #ranking = inject(ShipLayoutRanking, { optional: true });

  /** The item's value; the bar is `value / max` of the parent list. */
  value = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });

  constructor() {
    if (isDevMode() && !this.#ranking) {
      console.warn('<sh-lo-ranking-item> belongs inside <sh-lo-ranking>: without the list there is no max, so the bar stays empty.');
    }
  }

  percent = computed(() => {
    if (!this.#ranking) return 0;
    const max = this.#ranking.max() || 1;
    return Math.max(0, Math.min(100, (this.value() / max) * 100));
  });
}
