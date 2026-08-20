import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';
import { ShipSidenav } from '@ship-ui/core/ship-sidenav';

@Component({
  selector: 'app-overlay-sidenav',
  imports: [ShipIcon, ShipList, ShipSidenav, ShipButton],
  templateUrl: './overlay-sidenav.html',
  styleUrl: './overlay-sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlaySidenav {
  isNavOpen = signal(false);
}
