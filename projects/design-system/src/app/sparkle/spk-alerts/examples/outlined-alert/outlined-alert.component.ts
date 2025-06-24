import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleAlertComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-outlined-alert',
  standalone: true,
  imports: [SparkleAlertComponent],
  templateUrl: './outlined-alert.component.html',
  styleUrl: './outlined-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedAlertComponent {
  active = signal(false);
}
