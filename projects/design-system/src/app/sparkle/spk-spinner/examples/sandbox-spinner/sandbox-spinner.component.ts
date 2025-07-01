import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleRangeSliderComponent, SparkleSpinnerComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-sandbox-spinner',
  imports: [FormsModule, SparkleSpinnerComponent, SparkleRangeSliderComponent],
  templateUrl: './sandbox-spinner.component.html',
  styleUrl: './sandbox-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxSpinnerComponent {
  value = signal(40);
  valueAsPixels = computed(() => `${this.value()}px`);

  thickness = signal(5);
  thicknessAsPixels = computed(() => `${this.thickness()}px`);
}
