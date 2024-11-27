import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleProgressBarComponent } from 'spk/public';

@Component({
  selector: 'app-spk-progress-bar',
  imports: [SparkleProgressBarComponent],
  templateUrl: './spk-progress-bar.component.html',
  styleUrl: './spk-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkProgressBarComponent {}
