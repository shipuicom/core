import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';
import { ShipSidenav, ShipSidenavType } from '@ship-ui/core/ship-sidenav';

@Component({
  selector: 'app-sandbox-sidenav',
  imports: [ShipIcon, ShipList, ShipSidenav],
  templateUrl: './sandbox-sidenav.html',
  styleUrl: './sandbox-sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxSidenav {
  sidenavType = input<ShipSidenavType>('simple');
  isNavOpen = model(false);
  disableDrag = input(false);
}
