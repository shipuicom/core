import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleProgressBarComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-progress-bar',
  standalone: true,
  imports: [SparkleProgressBarComponent],
  templateUrl: './base-progress-bar.component.html',
  styleUrl: './base-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseProgressBarComponent {}
