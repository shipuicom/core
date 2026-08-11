import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-lists-parts',
  imports: [ApiReference],
  template: `
    <p>Swipe-to-reveal actions for individual list items.</p>
    <app-api-reference name="ShipListItemSwipe" />
  `,
  styleUrl: './lists-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListsParts {}
