import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicToggle } from './examples/basic-toggle/basic-toggle';

@Component({
  selector: 'app-toggles-overview',
  imports: [Previewer, PropertyViewer, BasicToggle],
  templateUrl: './toggles-overview.html',
  styleUrl: './toggles-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TogglesOverview {}
