import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { SandboxSidenav } from './examples/sandbox-sidenav/sandbox-sidenav';

@Component({
  selector: 'app-sidenavs',
  imports: [SandboxSidenav, Previewer, PropertyViewer],
  templateUrl: './sidenavs.html',
  styleUrl: './sidenavs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sidenavs {
  sidenavType = signal('overlay');
}
