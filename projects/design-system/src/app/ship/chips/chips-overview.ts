import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicChip } from './examples/basic-chip/basic-chip';

@Component({
  selector: 'app-chips-overview',
  imports: [Previewer, PropertyViewer, BasicChip],
  templateUrl: './chips-overview.html',
  styleUrl: './chips-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChipsOverview {}
