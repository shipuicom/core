import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-tables-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipTable" />`,
  styleUrl: './tables-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TablesApi {}
