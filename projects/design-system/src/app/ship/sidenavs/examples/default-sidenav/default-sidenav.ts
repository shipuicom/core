import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';
import { ShipSidenav } from '@ship-ui/core/ship-sidenav';
import { ShipButton } from '@ship-ui/core/ship-button';

@Component({
  selector: 'app-default-sidenav',
  imports: [ShipIcon, ShipList, ShipSidenav, ShipButton],
  templateUrl: './default-sidenav.html',
  styleUrl: './default-sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultSidenav {
  isNavOpen = signal(true);
}
