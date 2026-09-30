import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutStatVariant } from '@ship-ui/core';
import { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutStat } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-stat-sandbox',
  imports: [ShipLayoutStat, ShipChip, ShipIcon, ShipChartSparkline],
  templateUrl: './stat-sandbox.html',
  styleUrl: '../sandbox.scss',
  host: { class: 'stats' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatSandbox {
  variant = input<ShipLayoutStatVariant>('');
  // Last 8 weeks. Each series ends on the headline value and moves the same way as
  // its delta chip, so chart, number and chip tell one story.
  revenue = [26.8, 27.5, 27.1, 28.6, 29.4, 30.1, 31.8, 32.9];
  visitors = [51.8, 52.4, 51.1, 50.6, 49.9, 49.2, 48.9, 48.2];
  orders = [1080, 1115, 1102, 1164, 1190, 1211, 1236, 1284];
}
