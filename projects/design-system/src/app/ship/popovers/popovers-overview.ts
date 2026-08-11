import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { ButtonPopover } from './examples/button-popover/button-popover';

@Component({
  selector: 'app-popovers-overview',
  imports: [Previewer, PropertyViewer, ButtonPopover],
  templateUrl: './popovers-overview.html',
  styleUrl: './popovers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PopoversOverview {}
