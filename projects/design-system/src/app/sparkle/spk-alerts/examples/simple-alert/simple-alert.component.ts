import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleAlertComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-simple-alert',
  standalone: true,
  imports: [SparkleAlertComponent],
  templateUrl: './simple-alert.component.html',
  styleUrl: './simple-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleAlertComponent {
  active = signal(false);
}
