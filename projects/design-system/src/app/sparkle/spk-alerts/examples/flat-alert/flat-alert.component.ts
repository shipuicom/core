import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleAlertComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-flat-alert',
  standalone: true,
  imports: [SparkleAlertComponent],
  templateUrl: './flat-alert.component.html',
  styleUrl: './flat-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatAlertComponent {
  active = signal(false);
}
