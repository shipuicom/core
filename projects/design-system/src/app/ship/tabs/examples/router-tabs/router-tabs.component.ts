import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ShipIcon, ShipTabsComponent } from 'ship-ui';

@Component({
  selector: 'app-router-tabs',
  imports: [ShipTabsComponent, ShipIcon, RouterLinkActive, RouterLink],
  templateUrl: './router-tabs.component.html',
  styleUrl: './router-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouterTabsComponent {}
