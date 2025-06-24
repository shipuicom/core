import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleCheckboxComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-checkbox',
  standalone: true,
  imports: [SparkleCheckboxComponent],
  templateUrl: './base-checkbox.component.html',
  styleUrl: './base-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCheckboxComponent {
  active = signal(false);
}
