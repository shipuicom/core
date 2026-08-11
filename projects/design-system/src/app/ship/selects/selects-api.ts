import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-selects-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipSelect" />`,
  styleUrl: './selects-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SelectsApi {}
