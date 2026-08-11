import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-form-fields-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipFormField" />`,
  styleUrl: './form-fields-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormFieldsApi {}
