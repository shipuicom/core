import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';

@Component({
  selector: 'app-sparkline-variants',
  imports: [ShipChartSparkline],
  templateUrl: './sparkline-variants.html',
  styleUrl: './sparkline-variants.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparklineVariants {
  revenue = [4, 6, 5, 9, 7, 12, 10, 14, 13, 18];
  errors = [2, 1, 4, 3, 6, 5, 9, 4, 3, 2];
  latency = [120, 118, 125, 121, 119, 140, 132, 128, 122, 117];
  steps = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5];
}
