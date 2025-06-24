import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleToggleComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-simple-toggle',
  standalone: true,
  imports: [SparkleToggleComponent],
  templateUrl: './simple-toggle.component.html',
  styleUrl: './simple-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleToggleComponent {
  active = signal(false);
}
