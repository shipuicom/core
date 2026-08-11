import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-menus-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipMenu" />`,
  styleUrl: './menus-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MenusApi {}
