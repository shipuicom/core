import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipSidenavType } from '@ship-ui/core/ship-sidenav';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { DefaultSidenav } from './examples/default-sidenav/default-sidenav';
import { OverlaySidenav } from './examples/overlay-sidenav/overlay-sidenav';
import { SandboxSidenav } from './examples/sandbox-sidenav/sandbox-sidenav';
import { SimpleSidenav } from './examples/simple-sidenav/simple-sidenav';

@Component({
  selector: 'app-sidenavs-examples',
  imports: [Previewer, ShipButtonGroup, ShipToggle, SandboxSidenav, DefaultSidenav, SimpleSidenav, OverlaySidenav],
  templateUrl: './sidenavs-examples.html',
  styleUrl: './sidenavs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SidenavsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  sidenavType = signal<ShipSidenavType>('simple');
  isNavOpen = signal(false);
  disableDrag = signal(false);
}
