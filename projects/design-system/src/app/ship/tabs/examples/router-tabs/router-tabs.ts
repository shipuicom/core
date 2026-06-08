import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-router-tabs',
  imports: [ShipTabs, ShipIcon, RouterLinkActive, RouterLink],
  templateUrl: './router-tabs.html',
  styleUrl: './router-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouterTabsComponent {}
