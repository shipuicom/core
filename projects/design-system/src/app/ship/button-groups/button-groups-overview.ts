import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicButtonGroup } from './examples/basic-button-group/basic-button-group';

@Component({
  selector: 'app-button-groups-overview',
  imports: [Previewer, PropertyViewer, BasicButtonGroup],
  templateUrl: './button-groups-overview.html',
  styleUrl: './button-groups-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonGroupsOverview {}
