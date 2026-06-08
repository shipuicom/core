import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipSidenav } from '@ship-ui/core/ship-sidenav';
import { ShipButton } from '@ship-ui/core/ship-button';

@Component({
  selector: 'app-default-sidenav',
  imports: [ShipSidenav, ShipButton],
  templateUrl: './default-sidenav.html',
  styleUrl: './default-sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultSidenav {
  isNavOpen = signal(true);
}
