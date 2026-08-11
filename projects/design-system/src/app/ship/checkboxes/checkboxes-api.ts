import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-checkboxes-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipCheckbox" />`,
  styleUrl: './checkboxes-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CheckboxesApi {}
