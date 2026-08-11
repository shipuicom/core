import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-input-mask-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipInputMask" />`,
  styleUrl: './input-mask-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InputMaskApi {}
