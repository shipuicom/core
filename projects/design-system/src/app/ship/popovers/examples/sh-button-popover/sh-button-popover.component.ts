import { Component } from '@angular/core';
import { ShipButtonComponent, ShipPopoverComponent } from 'ship-ui';

@Component({
  selector: 'sh-button-popover',
  standalone: true,
  imports: [ShipPopoverComponent, ShipButtonComponent],
  templateUrl: './sh-button-popover.component.html',
  styleUrl: './sh-button-popover.component.scss',
})
export class ShButtonPopoverComponent {}
