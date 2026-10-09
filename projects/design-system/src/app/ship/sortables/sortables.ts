import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipAlert } from '@ship-ui/core/ship-alert';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-sortables',
  imports: [ShipAlert, ShipIcon, ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './sortables.html',
  styleUrl: './sortables.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sortables {}
