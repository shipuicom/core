import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleSpinnerComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-spinner',
  imports: [SparkleSpinnerComponent],
  templateUrl: './spk-spinner.component.html',
  styleUrl: './spk-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSpinnerComponent {}
