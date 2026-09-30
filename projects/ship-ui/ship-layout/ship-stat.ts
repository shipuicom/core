import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipLayoutStatVariant } from '@ship-ui/core';

/**
 * KPI tile. Slots: `p` (label), `h3` (value), `sh-chip` (delta), an
 * optional `sh-icon` and an optional `sh-chart-sparkline`/`[chart]`.
 * Put several in a CSS grid for a stats row. For a highlighted headline
 * metric use `sh-lo-stat-trend`, for progress toward a target
 * `sh-lo-stat-goal` or `sh-lo-stat-ring`.
 */
@Component({
  selector: 'sh-lo-stat',
  styleUrl: './ship-stat.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="icon"><ng-content select="sh-icon, [icon]" /></div>
    <div class="text">
      <ng-content select="p, [label]" />
      <div class="value">
        <ng-content select="h2, h3, [value]" />
        <ng-content select="sh-chip, [delta]" />
      </div>
    </div>
    <div class="chart"><ng-content select="sh-chart-sparkline, [chart]" /></div>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutStat {
  /** Visual variant: `type-b` icon beside the text, `type-c` flush (no padding, chart bleeds to the edges), `type-d` highlighted (colored wash, value and border in `color`, chart to the edges). Project default via `ShipConfig.layoutStat.variant`. */
  variant = input<ShipLayoutStatVariant | null>(null);
  /** Accent color (`ShipColor`) used by `type-d`; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('layoutStat', { variant: this.variant, color: this.color });
}
