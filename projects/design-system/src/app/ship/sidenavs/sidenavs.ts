import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { SandboxSidenav } from './examples/sandbox-sidenav/sandbox-sidenav';
import { DefaultSidenav } from './examples/default-sidenav/default-sidenav';
import { SimpleSidenav } from './examples/simple-sidenav/simple-sidenav';
import { OverlaySidenav } from './examples/overlay-sidenav/overlay-sidenav';

@Component({
  selector: 'app-sidenavs',
  imports: [
    ShipTabs,
    ApiReference,
    SandboxSidenav,
    DefaultSidenav,
    SimpleSidenav,
    OverlaySidenav,
    Previewer,
    PropertyViewer,
  ],
  templateUrl: './sidenavs.html',
  styleUrl: './sidenavs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sidenavs {
  activeTab = signal('overview');
  sidenavType = signal('overlay');
}
