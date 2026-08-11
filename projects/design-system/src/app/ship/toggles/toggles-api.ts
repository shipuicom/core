import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-toggles-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipToggle" />`,
  styleUrl: './toggles-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TogglesApi {}
