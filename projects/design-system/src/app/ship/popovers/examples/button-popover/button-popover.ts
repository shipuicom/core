import { Component } from '@angular/core';
import { ShipPopover } from 'ship-ui';

@Component({
  selector: 'button-popover',
  standalone: true,
  imports: [ShipPopover],
  templateUrl: './button-popover.html',
  styleUrl: './button-popover.scss',
})
export class ButtonPopover {}
