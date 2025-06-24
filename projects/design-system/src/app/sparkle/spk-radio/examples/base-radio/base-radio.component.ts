import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleRadioComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-radio',
  standalone: true,
  imports: [SparkleRadioComponent],
  templateUrl: './base-radio.component.html',
  styleUrl: './base-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseRadioComponent {
  active = signal(false);
}
