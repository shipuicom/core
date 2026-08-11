import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-datepickers-api',
  imports: [ApiReference],
  template: `
    <app-api-reference name="ShipDatepicker" />
    <app-api-reference name="ShipDatepickerInput" />
    <app-api-reference name="ShipDaterangeInput" />
  `,
  styleUrl: './datepickers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatepickersApi {}
