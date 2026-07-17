import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from '@ship-ui/core/ship-alert';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseColorPicker } from './examples/base-color-picker/base-color-picker';
import { BasicColorPicker } from './examples/basic-color-picker/basic-color-picker';

@Component({
  selector: 'app-color-pickers',
  imports: [ShipTabs, ApiReference, ShipAlert, Previewer, PropertyViewer, BasicColorPicker, BaseColorPicker, ShipChip],
  templateUrl: './color-pickers.html',
  styleUrl: './color-pickers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ColorPickers {
  activeTab = signal('overview');
}
