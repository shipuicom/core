import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleCheckboxComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-raised-checkbox',
  standalone: true,
  imports: [SparkleCheckboxComponent],
  templateUrl: './raised-checkbox.component.html',
  styleUrl: './raised-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedCheckboxComponent {
  active = signal(false);
}
