import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-chart-sparkline',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './chart-sparkline.html',
  styleUrl: './chart-sparkline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChartSparkline {}
