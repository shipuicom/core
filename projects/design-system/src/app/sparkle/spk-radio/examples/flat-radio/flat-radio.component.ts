import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleRadioComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-flat-radio',
  standalone: true,
  imports: [SparkleRadioComponent],
  templateUrl: './flat-radio.component.html',
  styleUrl: './flat-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatRadioComponent {
  active = signal(false);
}
