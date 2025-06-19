import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SparkleButtonComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-flat-button',
  imports: [SparkleIconComponent, SparkleButtonComponent],
  templateUrl: './flat-button.component.html',
  styleUrl: './flat-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatButtonComponent {
  isSmall = input<boolean>(false);
}
