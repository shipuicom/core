import { Component } from '@angular/core';
import { ShipButton, ShipPopover } from 'ship-ui';

@Component({
  selector: 'sh-button-popover',
  standalone: true,
  imports: [ShipPopover, ShipButton],
  templateUrl: './sh-button-popover.component.html',
  styleUrl: './sh-button-popover.component.scss',
})
export class ShButtonPopoverComponent {}
