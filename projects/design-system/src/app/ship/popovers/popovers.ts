import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-popovers',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './popovers.html',
  styleUrl: './popovers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Popovers {}
