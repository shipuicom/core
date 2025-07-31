import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlertComponent } from 'ship-ui';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { BaseColorPickerComponent } from './examples/base-color-picker/base-color-picker.component';

@Component({
  selector: 'app-color-pickers',
  imports: [ShipAlertComponent, PreviewerComponent, BaseColorPickerComponent],
  templateUrl: './color-pickers.component.html',
  styleUrl: './color-pickers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ColorPickersComponent {}
