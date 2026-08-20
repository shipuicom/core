import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipList } from '@ship-ui/core/ship-list';
import { ShipSidenav } from '@ship-ui/core/ship-sidenav';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-simple-sidenav',
  imports: [ShipList, ShipSidenav, ShipButton, ShipIcon],
  templateUrl: './simple-sidenav.html',
  styleUrl: './simple-sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSidenav {
  isNavOpen = signal(true);
}
