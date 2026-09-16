import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-view-transitions-api',
  imports: [ApiReference],
  template: `
    <app-api-reference name="ShipViewTransition" />
    <app-api-reference name="ShipViewTransitions" />
  `,
  styleUrl: './view-transitions-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ViewTransitionsApi {}
