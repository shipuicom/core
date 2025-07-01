import { Component } from '@angular/core';
import { SparkleButtonComponent, SparklePopoverComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'spk-button-popover',
  standalone: true,
  imports: [SparklePopoverComponent, SparkleButtonComponent],
  templateUrl: './spk-button-popover.component.html',
  styleUrl: './spk-button-popover.component.scss',
})
export class SpkButtonPopoverComponent {}
