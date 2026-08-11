import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { DefaultSidenav } from './examples/default-sidenav/default-sidenav';

@Component({
  selector: 'app-sidenavs-overview',
  imports: [Previewer, PropertyViewer, DefaultSidenav],
  templateUrl: './sidenavs-overview.html',
  styleUrl: './sidenavs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SidenavsOverview {}
