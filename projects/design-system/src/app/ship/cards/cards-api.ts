import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-cards-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipCard" />`,
  styleUrl: './cards-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CardsApi {}
