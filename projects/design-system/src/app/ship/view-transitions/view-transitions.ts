import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-view-transitions',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './view-transitions.html',
  styleUrl: './view-transitions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ViewTransitions {}
