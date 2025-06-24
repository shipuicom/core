import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleToggleComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-flat-toggle',
  standalone: true,
  imports: [SparkleToggleComponent],
  templateUrl: './flat-toggle.component.html',
  styleUrl: './flat-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatToggleComponent {
  active = signal(false);
}
