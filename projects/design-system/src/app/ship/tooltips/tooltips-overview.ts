import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicTooltip } from './examples/basic-tooltip/basic-tooltip';

@Component({
  selector: 'app-tooltips-overview',
  imports: [Previewer, PropertyViewer, BasicTooltip],
  templateUrl: './tooltips-overview.html',
  styleUrl: './tooltips-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TooltipsOverview {}
