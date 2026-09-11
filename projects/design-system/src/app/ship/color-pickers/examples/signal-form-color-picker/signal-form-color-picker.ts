import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { ShipColorPickerInput } from '@ship-ui/core/ship-color-picker';

@Component({
  selector: 'app-signal-form-color-picker',
  imports: [FormField, ShipColorPickerInput],
  templateUrl: './signal-form-color-picker.html',
  styleUrl: './signal-form-color-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFormColorPicker {
  color = signal('#ff5722');
  colorForm = form(this.color);
}
