import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAccordion } from 'ship-ui';

@Component({
  selector: 'app-type-b-accordion',
  imports: [ShipAccordion],
  templateUrl: './type-b-accordion.html',
  styleUrl: './type-b-accordion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeBAccordion {}
