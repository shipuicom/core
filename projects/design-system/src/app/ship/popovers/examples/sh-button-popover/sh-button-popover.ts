import { Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipPopover } from '@ship-ui/core/ship-popover';

@Component({
  selector: 'sh-button-popover',
  standalone: true,
  imports: [ShipPopover, ShipButton],
  templateUrl: './sh-button-popover.html',

  styleUrl: './sh-button-popover.scss',
})
export class ShButtonPopover {}
