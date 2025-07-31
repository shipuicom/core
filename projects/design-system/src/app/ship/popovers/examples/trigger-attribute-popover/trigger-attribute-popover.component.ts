import { Component } from '@angular/core';
import { ShipPopoverComponent } from '@ship-ui/core';

@Component({
  selector: 'trigger-attribute-popover',
  standalone: true,
  imports: [ShipPopoverComponent],
  templateUrl: './trigger-attribute-popover.component.html',
  styleUrl: './trigger-attribute-popover.component.scss',
})
export class TriggerAttributePopoverComponent {}
