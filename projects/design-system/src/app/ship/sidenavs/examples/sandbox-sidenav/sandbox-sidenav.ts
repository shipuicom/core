import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipSidenav, ShipSidenavType } from '@ship-ui/core/ship-sidenav';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

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
