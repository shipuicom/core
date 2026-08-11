import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-color-pickers-api',
  imports: [ApiReference],
  template: `
    <app-api-reference name="ShipColorPicker" />
    <app-api-reference name="ShipColorPickerInput" />
  `,
  styleUrl: './color-pickers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ColorPickersApi {}
