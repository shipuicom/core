import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleRadioComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-outlined-radio',
  standalone: true,
  imports: [SparkleRadioComponent],
  templateUrl: './outlined-radio.component.html',
  styleUrl: './outlined-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedRadioComponent {
  active = signal(false);
}
