import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleCheckboxComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-flat-checkbox',
  standalone: true,
  imports: [SparkleCheckboxComponent],
  templateUrl: './flat-checkbox.component.html',
  styleUrl: './flat-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatCheckboxComponent {
  active = signal(false);
}
