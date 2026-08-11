import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-radio-buttons-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipRadio" />`,
  styleUrl: './radio-buttons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadioButtonsApi {}
