import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ShipIcon, ShipTabs } from 'ship-ui';

@Component({
  selector: 'app-router-tabs',
  imports: [ShipTabs, ShipIcon, RouterLinkActive, RouterLink],
  templateUrl: './router-tabs.component.html',
  styleUrl: './router-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouterTabsComponent {}
