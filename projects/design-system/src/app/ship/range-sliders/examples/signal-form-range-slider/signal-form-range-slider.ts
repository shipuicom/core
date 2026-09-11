import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, max, min, validate } from '@angular/forms/signals';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';

@Component({
  selector: 'app-signal-form-range-slider',
  imports: [FormField, ShipRangeSlider],
  templateUrl: './signal-form-range-slider.html',
  styleUrl: './signal-form-range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFormRangeSlider {
  volume = signal(25);
  volumeForm = form(this.volume, (path) => {
    // min/max are reflected onto the native range input by signal forms.
    min(path, 0);
    max(path, 100);
    validate(path, ({ value }) => (value() > 80 ? { kind: 'loud', message: 'Keep it under 80' } : undefined));
  });
}
