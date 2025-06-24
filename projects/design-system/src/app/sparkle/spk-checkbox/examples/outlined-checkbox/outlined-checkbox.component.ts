import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleCheckboxComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-outlined-checkbox',
  standalone: true,
  imports: [SparkleCheckboxComponent],
  templateUrl: './outlined-checkbox.component.html',
  styleUrl: './outlined-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedCheckboxComponent {
  active = signal(false);
}
