import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicSpinner } from './examples/basic-spinner/basic-spinner';

@Component({
  selector: 'app-spinners-overview',
  imports: [Previewer, PropertyViewer, BasicSpinner],
  templateUrl: './spinners-overview.html',
  styleUrl: './spinners-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpinnersOverview {}
