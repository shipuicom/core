import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleToggleComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-toggle',
  standalone: true,
  imports: [SparkleToggleComponent],
  templateUrl: './base-toggle.component.html',
  styleUrl: './base-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseToggleComponent {
  active = signal(false);
}
