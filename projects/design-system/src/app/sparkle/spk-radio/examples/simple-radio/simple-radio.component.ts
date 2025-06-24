import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleRadioComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-simple-radio',
  standalone: true,
  imports: [SparkleRadioComponent],
  templateUrl: './simple-radio.component.html',
  styleUrl: './simple-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleRadioComponent {
  active = signal(false);
}
