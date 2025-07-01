import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleProgressBarComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-raised-progress-bar',
  standalone: true,
  imports: [SparkleProgressBarComponent],
  templateUrl: './raised-progress-bar.component.html',
  styleUrl: './raised-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedProgressBarComponent {}
