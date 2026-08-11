import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-progress-bars',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './progress-bars.html',
  styleUrl: './progress-bars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProgressBars {}
