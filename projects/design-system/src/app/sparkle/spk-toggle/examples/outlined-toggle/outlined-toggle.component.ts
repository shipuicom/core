import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleToggleComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-outlined-toggle',
  standalone: true,
  imports: [SparkleToggleComponent],
  templateUrl: './outlined-toggle.component.html',
  styleUrl: './outlined-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedToggleComponent {
  active = signal(false);
}
