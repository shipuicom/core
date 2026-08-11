import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlert } from '@ship-ui/core/ship-alert';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicProgressBar } from './examples/basic-progress-bar/basic-progress-bar';

@Component({
  selector: 'app-progress-bars-overview',
  imports: [Previewer, PropertyViewer, ShipAlert, BasicProgressBar],
  templateUrl: './progress-bars-overview.html',
  styleUrl: './progress-bars-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProgressBarsOverview {}
