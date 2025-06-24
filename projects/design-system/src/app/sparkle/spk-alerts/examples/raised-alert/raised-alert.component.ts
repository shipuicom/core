import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleAlertComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-raised-alert',
  standalone: true,
  imports: [SparkleAlertComponent],
  templateUrl: './raised-alert.component.html',
  styleUrl: './raised-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedAlertComponent {
  active = signal(false);
}
