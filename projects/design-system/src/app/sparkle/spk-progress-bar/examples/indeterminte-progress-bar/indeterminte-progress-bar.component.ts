import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleProgressBarComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-indeterminte-progress-bar',
  imports: [SparkleProgressBarComponent],
  templateUrl: './indeterminte-progress-bar.component.html',
  styleUrl: './indeterminte-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndeterminteProgressBarComponent {}
