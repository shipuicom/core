import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';

@Component({
  selector: 'app-basic-chart-sparkline',
  imports: [ShipChartSparkline],
  templateUrl: './basic-chart-sparkline.html',
  styleUrl: './basic-chart-sparkline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicChartSparkline {
  visits = [12, 18, 15, 22, 30, 26, 34, 41, 38, 45];
}
