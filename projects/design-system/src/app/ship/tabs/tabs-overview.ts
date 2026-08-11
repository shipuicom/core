import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicTab } from './examples/basic-tab/basic-tab';

@Component({
  selector: 'app-tabs-overview',
  imports: [Previewer, PropertyViewer, BasicTab],
  templateUrl: './tabs-overview.html',
  styleUrl: './tabs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabsOverview {}
