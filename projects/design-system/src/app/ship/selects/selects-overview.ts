import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseSelect } from './examples/base-select/base-select';

@Component({
  selector: 'app-selects-overview',
  imports: [Previewer, PropertyViewer, BaseSelect],
  templateUrl: './selects-overview.html',
  styleUrl: './selects-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SelectsOverview {}
