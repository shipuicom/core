import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-chart-sparkline-api',
  imports: [ApiReference],
  template: `
    <app-api-reference name="ShipChartSparkline" />
  `,
  styleUrl: './chart-sparkline-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChartSparklineApi {}
