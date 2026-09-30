import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipLayoutStatTrendVariant } from '@ship-ui/core';

/**
 * Headline metric: the one number a dashboard leads with. A larger value,
 * a colored wash and a full-bleed trend chart along the bottom. Slots:
 * `p` (label), `h2`/`h3` (value), `sh-chip` (delta), an optional `sh-icon`,
 * `sh-chart-sparkline`/`[chart]` and a `small`/`[footer]` comparison line
 * ("Up from $29.4k last month").
 */
@Component({
  selector: 'sh-lo-stat-trend',
  styleUrl: './ship-stat-trend.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="head">
      <ng-content select="sh-icon, [icon]" />
      <ng-content select="p, [label]" />
    </div>
    <div class="value">
      <ng-content select="h2, h3, [value]" />
      <ng-content select="sh-chip, [delta]" />
    </div>
    <div class="footer"><ng-content select="small, [footer]" /></div>
    <div class="chart"><ng-content select="sh-chart-sparkline, [chart]" /></div>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutStatTrend {
  /** Accent color (`ShipColor`) for the wash, icon and border; defaults to primary. */
  color = input<ShipColor | null>(null);
  /** Visual variant: `type-b` puts the chart beside the text instead of under it, `type-c` drops the wash for a plain surface. Project default via `ShipConfig.layoutStatTrend.variant`. */
  variant = input<ShipLayoutStatTrendVariant | null>(null);

  hostClasses = shipComponentClasses('layoutStatTrend', { variant: this.variant, color: this.color });
}
