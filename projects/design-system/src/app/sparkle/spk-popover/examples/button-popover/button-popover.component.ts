import { Component } from '@angular/core';
import { SparklePopoverComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'button-popover',
  standalone: true,
  imports: [SparklePopoverComponent],
  templateUrl: './button-popover.component.html',
  styleUrl: './button-popover.component.scss',
})
export class ButtonPopoverComponent {}
