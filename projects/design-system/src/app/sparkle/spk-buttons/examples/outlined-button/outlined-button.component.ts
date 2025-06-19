import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SparkleButtonComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-outlined-button',
  imports: [SparkleIconComponent, SparkleButtonComponent],
  templateUrl: './outlined-button.component.html',
  styleUrl: './outlined-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedButtonComponent {
  isSmall = input<boolean>(false);
}
