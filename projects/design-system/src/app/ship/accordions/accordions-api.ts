import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-accordions-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipAccordion" />`,
  styleUrl: './accordions-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccordionsApi {}
