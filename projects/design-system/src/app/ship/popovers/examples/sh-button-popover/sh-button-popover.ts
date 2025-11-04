import { Component } from '@angular/core';
import { ShipButton, ShipPopover } from 'ship-ui';

@Component({
  selector: 'sh-button-popover',
  standalone: true,
  imports: [ShipPopover, ShipButton],
  templateUrl: './sh-button-popover.html',
  styleUrl: './sh-button-popover.scss',
})
export class ShButtonPopover {}
