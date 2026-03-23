import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { SandboxSidenav } from './examples/sandbox-sidenav/sandbox-sidenav';
import { DefaultSidenav } from './examples/default-sidenav/default-sidenav';
import { SimpleSidenav } from './examples/simple-sidenav/simple-sidenav';
import { OverlaySidenav } from './examples/overlay-sidenav/overlay-sidenav';

@Component({
  selector: 'app-sidenavs',
  imports: [SandboxSidenav, DefaultSidenav, SimpleSidenav, OverlaySidenav, Previewer, PropertyViewer],
  templateUrl: './sidenavs.html',
  styleUrl: './sidenavs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sidenavs {
  sidenavType = signal('overlay');
}
