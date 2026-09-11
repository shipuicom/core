import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-code-inputs-api',
  imports: [ApiReference],
  template: `
    <app-api-reference name="ShipCodeInput" />
    <app-api-reference name="ShipCodeInputGroup" />
  `,
  styleUrl: './code-inputs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CodeInputsApi {}
