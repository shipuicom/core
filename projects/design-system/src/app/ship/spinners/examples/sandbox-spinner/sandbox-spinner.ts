import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider, ShipSpinner } from 'ship-ui';

@Component({
  selector: 'app-sandbox-spinner',
  imports: [FormsModule, ShipSpinner, ShipRangeSlider],
  templateUrl: './sandbox-spinner.html',
  styleUrl: './sandbox-spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxSpinner {
  value = signal(40);
  valueAsPixels = computed(() => `${this.value()}px`);

  thickness = signal(5);
  thicknessAsPixels = computed(() => `${this.thickness()}px`);
}
