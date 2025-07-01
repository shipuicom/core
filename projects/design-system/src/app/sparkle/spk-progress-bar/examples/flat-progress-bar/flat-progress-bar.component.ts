import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleProgressBarComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-flat-progress-bar',
  standalone: true,
  imports: [SparkleProgressBarComponent],
  templateUrl: './flat-progress-bar.component.html',
  styleUrl: './flat-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatProgressBarComponent {}
