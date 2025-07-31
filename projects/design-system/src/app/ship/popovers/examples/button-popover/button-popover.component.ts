import { Component } from '@angular/core';
import { ShipPopoverComponent } from 'ship-ui';

@Component({
  selector: 'button-popover',
  standalone: true,
  imports: [ShipPopoverComponent],
  templateUrl: './button-popover.component.html',
  styleUrl: './button-popover.component.scss',
})
export class ButtonPopoverComponent {}
