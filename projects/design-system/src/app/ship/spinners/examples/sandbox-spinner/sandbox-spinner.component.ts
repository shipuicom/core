import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSliderComponent, ShipSpinnerComponent } from 'ship-ui';

@Component({
  selector: 'app-sandbox-spinner',
  imports: [FormsModule, ShipSpinnerComponent, ShipRangeSliderComponent],
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
