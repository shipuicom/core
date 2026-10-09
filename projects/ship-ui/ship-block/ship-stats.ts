import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockStatsVariant, ShipColor } from '@ship-ui/core';

/**
 * A band of key numbers: a header (`[eyebrow]`/`sh-chip`, `h2`, `p`, `[actions]`) and one `sh-bl-stat` per number.
 * Set `--stats-min` for another minimum column width.
 */
@Component({
  selector: 'sh-bl-stats',
  styleUrl: './ship-stats.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="head">
        <ng-content select="[eyebrow], sh-chip" />
        <ng-content select="h2" />
        <ng-content select="p, [description]" />
        <div class="actions"><ng-content select="[actions]" /></div>
      </div>
      <div class="items"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockStats {
  /** Visual variant: default a row of numbers split by hairlines, `type-b` every number on a card, `type-c` a solid colour panel. Project default via `ShipConfig.blockStats.variant`. */
  variant = input<ShipBlockStatsVariant | null>(null);
  /** Accent (`ShipColor`) for the eyebrow, the icons and the `type-c` panel; defaults to primary (grey panel). */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockStats', { variant: this.variant, color: this.color });
}

/** One number of `sh-bl-stats`: `sh-icon`/`[icon]`, `b`/`strong`/`[value]` (the number), `p`/`[label]`, then a note. */
@Component({
  selector: 'sh-bl-stat',
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-content select="sh-icon, [icon]" />
    <ng-content select="b, strong, [value]" />
    <ng-content select="p, [label]" />
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipBlockStat {}
