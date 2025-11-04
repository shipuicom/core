import { Component } from '@angular/core';
import { ShipPopover } from 'ship-ui';

@Component({
  selector: 'trigger-attribute-popover',
  standalone: true,
  imports: [ShipPopover],
  templateUrl: './trigger-attribute-popover.component.html',
  styleUrl: './trigger-attribute-popover.component.scss',
})
export class TriggerAttributePopoverComponent {}
