import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAccordion } from 'ship-ui';

@Component({
  selector: 'app-base-accordion',
  imports: [ShipAccordion],
  templateUrl: './base-accordion.html',
  styleUrl: './base-accordion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseAccordion {}
