import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-tooltips-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipTooltip" />`,
  styleUrl: './tooltips-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TooltipsApi {}
