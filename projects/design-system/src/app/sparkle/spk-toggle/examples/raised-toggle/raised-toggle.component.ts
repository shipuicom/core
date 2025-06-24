import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleToggleComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-raised-toggle',
  standalone: true,
  imports: [SparkleToggleComponent],
  templateUrl: './raised-toggle.component.html',
  styleUrl: './raised-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedToggleComponent {
  active = signal(false);
}
