import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-steppers-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipStepper" />`,
  styleUrl: './steppers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SteppersApi {}
