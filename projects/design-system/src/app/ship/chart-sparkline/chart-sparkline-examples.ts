import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicChartSparkline } from './examples/basic-chart-sparkline/basic-chart-sparkline';
import { LiveChartSparkline } from './examples/live-chart-sparkline/live-chart-sparkline';
import { SparklineVariants } from './examples/sparkline-variants/sparkline-variants';

@Component({
  selector: 'app-chart-sparkline-examples',
  imports: [Previewer, BasicChartSparkline, SparklineVariants, LiveChartSparkline],
  templateUrl: './chart-sparkline-examples.html',
  styleUrl: './chart-sparkline-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChartSparklineExamples {}
