import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipColorPickerInput } from '@ship-ui/core/ship-color-picker';

const COLORS = ['rgb(239, 68, 68)', 'rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(234, 179, 8)'];

@Component({
  selector: 'app-live-updates-color-picker',
  standalone: true,
  imports: [FormsModule, ShipColorPickerInput],
  templateUrl: './live-updates-color-picker.html',
  styleUrl: './live-updates-color-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveUpdatesColorPicker implements OnDestroy {
  // Cycled from OUTSIDE the component once per second. The text field and the color
  // swatch must both re-render to the new value on every tick.
  color = signal<string>(COLORS[0]);

  #index = 0;
  #timer = setInterval(() => {
    this.#index = (this.#index + 1) % COLORS.length;
    this.color.set(COLORS[this.#index]);
  }, 1000);

  ngOnDestroy() {
    clearInterval(this.#timer);
  }
}
