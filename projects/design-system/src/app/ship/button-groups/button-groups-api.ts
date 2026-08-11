import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-button-groups-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipButtonGroup" />`,
  styleUrl: './button-groups-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonGroupsApi {}
