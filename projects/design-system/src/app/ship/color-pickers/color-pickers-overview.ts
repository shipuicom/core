import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlert } from '@ship-ui/core/ship-alert';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicColorPicker } from './examples/basic-color-picker/basic-color-picker';

@Component({
  selector: 'app-color-pickers-overview',
  imports: [Previewer, PropertyViewer, ShipAlert, ShipChip, BasicColorPicker],
  templateUrl: './color-pickers-overview.html',
  styleUrl: './color-pickers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ColorPickersOverview {}
