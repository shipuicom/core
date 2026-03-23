import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipSidenav, ShipButton, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-simple-sidenav',
  imports: [ShipSidenav, ShipButton, ShipIcon],
  templateUrl: './simple-sidenav.html',
  styleUrl: './simple-sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSidenav {
  isNavOpen = signal(true);
}
