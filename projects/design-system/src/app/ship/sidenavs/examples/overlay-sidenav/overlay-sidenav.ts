import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButton, ShipSidenav } from 'ship-ui';

@Component({
  selector: 'app-overlay-sidenav',
  imports: [ShipSidenav, ShipButton],
  templateUrl: './overlay-sidenav.html',
  styleUrl: './overlay-sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlaySidenav {
  isNavOpen = signal(false);
}
