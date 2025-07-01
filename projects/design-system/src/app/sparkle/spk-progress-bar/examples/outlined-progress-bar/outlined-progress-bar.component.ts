import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleProgressBarComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-outlined-progress-bar',
  standalone: true,
  imports: [SparkleProgressBarComponent],
  templateUrl: './outlined-progress-bar.component.html',
  styleUrl: './outlined-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedProgressBarComponent {}
