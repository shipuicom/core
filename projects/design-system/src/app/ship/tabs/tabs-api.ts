import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-tabs-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipTabs" />`,
  styleUrl: './tabs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabsApi {}
