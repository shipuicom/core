import { Component } from '@angular/core';
import { ShipPopover } from '@ship-ui/core/ship-popover';

@Component({
  selector: 'centered-popover',
  standalone: true,
  imports: [ShipPopover],
  templateUrl: './centered-popover.html',

  styleUrl: './centered-popover.scss',
})
export class CenteredPopover {}
