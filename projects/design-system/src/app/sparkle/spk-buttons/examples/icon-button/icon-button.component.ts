import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SparkleButtonComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-icon-button',
  imports: [SparkleIconComponent, SparkleButtonComponent],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButtonComponent {
  isSmall = input<boolean>(false);
}
