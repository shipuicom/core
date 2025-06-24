import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleRadioComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-raised-radio',
  standalone: true,
  imports: [SparkleRadioComponent],
  templateUrl: './raised-radio.component.html',
  styleUrl: './raised-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedRadioComponent {
  active = signal(false);
}
