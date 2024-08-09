import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleProgressBarComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-progress-bar',
  standalone: true,
  imports: [SparkleProgressBarComponent],
  templateUrl: './spk-progress-bar.component.html',
  styleUrl: './spk-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkProgressBarComponent {}
