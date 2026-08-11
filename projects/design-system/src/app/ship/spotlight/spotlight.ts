import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-spotlight',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './spotlight.html',
  styleUrl: './spotlight.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpotlightShowcase {}
