import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipSidenav, ShipButton } from 'ship-ui';

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
