import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';

@Component({
  selector: 'app-live-updates-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSlider],
  templateUrl: './live-updates-range-slider.html',
  styleUrl: './live-updates-range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveUpdatesRangeSlider implements OnDestroy {
  // Driven from OUTSIDE the component once per second. The slider's thumb, fill and
  // indicator must follow every change — proving the internal state mirrors the model.
  value = signal(50);

  #timer = setInterval(() => this.value.update((v) => (v >= 100 ? 0 : v + 10)), 1000);

  ngOnDestroy() {
    clearInterval(this.#timer);
  }
}
