import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlert, ShipChip } from 'ship-ui';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseColorPicker } from './examples/base-color-picker/base-color-picker';

@Component({
  selector: 'app-color-pickers',
  imports: [ShipAlert, Previewer, PropertyViewer, BaseColorPicker, ShipChip],
  templateUrl: './color-pickers.html',
  styleUrl: './color-pickers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ColorPickers {}
