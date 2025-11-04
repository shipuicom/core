import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlert } from 'ship-ui';
import { Previewer } from '../../previewer/previewer';
import { BaseColorPicker } from './examples/base-color-picker/base-color-picker';

@Component({
  selector: 'app-color-pickers',
  imports: [ShipAlert, Previewer, BaseColorPicker],
  templateUrl: './color-pickers.html',
  styleUrl: './color-pickers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ColorPickers {}
