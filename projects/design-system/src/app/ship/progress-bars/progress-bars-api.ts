import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-progress-bars-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipProgressBar" />`,
  styleUrl: './progress-bars-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProgressBarsApi {}
