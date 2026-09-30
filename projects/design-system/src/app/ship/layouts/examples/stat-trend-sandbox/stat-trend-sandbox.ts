import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutStatTrendVariant } from '@ship-ui/core';
import { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutStatTrend } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-stat-trend-sandbox',
  imports: [ShipLayoutStatTrend, ShipChip, ShipIcon, ShipChartSparkline],
  templateUrl: './stat-trend-sandbox.html',
  styleUrl: '../sandbox.scss',
  host: { class: 'stats' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatTrendSandbox {
  variant = input<ShipLayoutStatTrendVariant>('');

  // Last 8 weeks, in thousands, ending on the headline value.
  revenue = [26.8, 27.5, 27.1, 28.6, 29.4, 30.1, 31.8, 32.9];
  refunds = [1.1, 1.2, 1.1, 1.3, 1.4, 1.5, 1.6, 1.8];
}
