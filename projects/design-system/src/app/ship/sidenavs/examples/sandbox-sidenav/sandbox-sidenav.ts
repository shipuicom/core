import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup, ShipSidenav, ShipSidenavType, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-sandbox-sidenav',
  imports: [FormsModule, ShipSidenav, ShipButtonGroup, ShipToggle],
  templateUrl: './sandbox-sidenav.html',
  styleUrl: './sandbox-sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxSidenav {
  sidenavType = signal<ShipSidenavType>('simple');
  isNavOpen = signal(false);
  disableDrag = signal(false);
}
