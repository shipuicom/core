import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseDivider } from './examples/base-divider/base-divider';

@Component({
  selector: 'app-dividers-overview',
  imports: [Previewer, PropertyViewer, BaseDivider],
  templateUrl: './dividers-overview.html',
  styleUrl: './dividers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DividersOverview {}
