import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleProgressBarComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-loaders',
  standalone: true,
  imports: [SparkleProgressBarComponent],
  templateUrl: './spk-loaders.component.html',
  styleUrl: './spk-loaders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkLoadersComponent {}
