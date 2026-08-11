import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-sidenavs',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './sidenavs.html',
  styleUrl: './sidenavs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sidenavs {}
