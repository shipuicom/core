import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-virtual-scrolls',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './virtual-scrolls.html',
  styleUrl: './virtual-scrolls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VirtualScrolls {}
