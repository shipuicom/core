import { Component } from '@angular/core';
import { SparklePopoverComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'trigger-attribute-popover',
  standalone: true,
  imports: [SparklePopoverComponent],
  templateUrl: './trigger-attribute-popover.component.html',
  styleUrl: './trigger-attribute-popover.component.scss',
})
export class TriggerAttributePopoverComponent {}
