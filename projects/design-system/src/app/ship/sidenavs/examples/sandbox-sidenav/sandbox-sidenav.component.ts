import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup, ShipSidenav, ShipSidenavType, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-sandbox-sidenav',
  imports: [FormsModule, ShipSidenav, ShipButtonGroup, ShipToggle],
  templateUrl: './sandbox-sidenav.component.html',
  styleUrl: './sandbox-sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxSidenavComponent {
  sidenavType = signal<ShipSidenavType>('simple');
  isNavOpen = signal(false);
  disableDrag = signal(false);
}
