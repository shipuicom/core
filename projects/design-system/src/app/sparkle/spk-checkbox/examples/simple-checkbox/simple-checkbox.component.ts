import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleCheckboxComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-simple-checkbox',
  standalone: true,
  imports: [SparkleCheckboxComponent],
  templateUrl: './simple-checkbox.component.html',
  styleUrl: './simple-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleCheckboxComponent {
  active = signal(false);
}
