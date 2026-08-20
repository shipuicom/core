import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { SimpleSidenav } from './examples/simple-sidenav/simple-sidenav';

@Component({
  selector: 'app-sidenavs-overview',
  imports: [Previewer, PropertyViewer, SimpleSidenav],
  templateUrl: './sidenavs-overview.html',
  styleUrl: './sidenavs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SidenavsOverview {}
