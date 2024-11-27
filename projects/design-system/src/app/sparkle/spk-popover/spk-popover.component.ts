import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparklePopoverComponent } from 'spk/public';

@Component({
  selector: 'app-spk-popover',
  imports: [SparklePopoverComponent],
  templateUrl: './spk-popover.component.html',
  styleUrl: './spk-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkPopoverComponent {}
