import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseDivider } from './examples/base-divider/base-divider';
import { TextDivider } from './examples/text-divider/text-divider';

@Component({
  selector: 'app-dividers',
  imports: [ShipTabs, ApiReference, BaseDivider, TextDivider, PropertyViewer, Previewer],
  templateUrl: './dividers.html',
  styleUrl: './dividers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dividers {
  activeTab = signal('overview');
}
