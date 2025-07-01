import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SparkleButtonGroupComponent,
  SparkleIconComponent,
  SparkleRangeSliderComponent,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-sandbox-icon',
  imports: [FormsModule, SparkleIconComponent, SparkleButtonGroupComponent, SparkleRangeSliderComponent],
  templateUrl: './sandbox-icon.component.html',
  styleUrl: './sandbox-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxIconComponent {
  size = signal<string>('');
  sizeValue = signal<number>(10);
  colorClass = signal<string>('');
}
