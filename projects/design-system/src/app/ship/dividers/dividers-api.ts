import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-dividers-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipDivider" />`,
  styleUrl: './dividers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DividersApi {}
