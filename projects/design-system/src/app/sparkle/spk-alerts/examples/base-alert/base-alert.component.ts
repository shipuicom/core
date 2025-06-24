import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleAlertComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-alert',
  standalone: true,
  imports: [SparkleAlertComponent],
  templateUrl: './base-alert.component.html',
  styleUrl: './base-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseAlertComponent {
  active = signal(false);
}
