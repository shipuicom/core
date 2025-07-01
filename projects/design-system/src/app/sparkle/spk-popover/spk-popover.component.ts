import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleButtonComponent, SparklePopoverComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-popover',
  imports: [SparklePopoverComponent, SparkleButtonComponent],
  templateUrl: './spk-popover.component.html',
  styleUrl: './spk-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkPopoverComponent {}
