import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicChartSparkline } from './examples/basic-chart-sparkline/basic-chart-sparkline';

@Component({
  selector: 'app-chart-sparkline-overview',
  imports: [Previewer, PropertyViewer, Highlight, BasicChartSparkline],
  templateUrl: './chart-sparkline-overview.html',
  styleUrl: './chart-sparkline-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChartSparklineOverview {
  variablesExample = `sh-chart-sparkline {
  --chart-stroke: var(--primary-8);   /* line and dot */
  --chart-fill: var(--primary-3);     /* area under the line */
  --chart-fill-opacity: 0.6;
  --chart-stroke-width: 2;            /* in px, does not scale with the box */
  --chart-dot-size: 6px;
  --chart-h: 2rem;                    /* default height, width is 100% */
  --chart-pad: calc(var(--chart-stroke-width) * 0.5px + 1px); /* keeps the top and bottom strokes whole */
}`;

  scalesExample = `import { extent, linearScale, linePath, niceTicks } from '@ship-ui/core/ship-chart-scales';

const y = linearScale(extent(values), [100, 0]);
const d = linePath(values.map((v, i) => ({ x: i * 10, y: y(v) })), 'monotone');
const ticks = niceTicks([0, 87]); // [0, 20, 40, 60, 80]`;
}
