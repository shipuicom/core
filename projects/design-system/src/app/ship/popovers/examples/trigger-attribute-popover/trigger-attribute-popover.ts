import { Component } from '@angular/core';
import { ShipPopover } from 'ship-ui';

@Component({
  selector: 'trigger-attribute-popover',
  standalone: true,
  imports: [ShipPopover],
  templateUrl: './trigger-attribute-popover.html',
  styleUrl: './trigger-attribute-popover.scss',
})
export class TriggerAttributePopover {}
