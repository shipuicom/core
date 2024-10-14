import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparklePopoverComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-popover',
  standalone: true,
  imports: [SparklePopoverComponent],
  templateUrl: './spk-popover.component.html',
  styleUrl: './spk-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkPopoverComponent {}
