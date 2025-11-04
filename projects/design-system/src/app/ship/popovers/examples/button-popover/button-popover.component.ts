import { Component } from '@angular/core';
import { ShipPopover } from 'ship-ui';

@Component({
  selector: 'button-popover',
  standalone: true,
  imports: [ShipPopover],
  templateUrl: './button-popover.component.html',
  styleUrl: './button-popover.component.scss',
})
export class ButtonPopoverComponent {}
