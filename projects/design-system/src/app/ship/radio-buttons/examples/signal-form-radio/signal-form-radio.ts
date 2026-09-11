import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ShipRadio } from '@ship-ui/core/ship-radio';

@Component({
  selector: 'app-signal-form-radio',
  imports: [FormField, ShipRadio],
  templateUrl: './signal-form-radio.html',
  styleUrl: './signal-form-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFormRadio {
  sizes = ['Small', 'Medium', 'Large'];

  size = signal('');
  sizeForm = form(this.size, (path) => {
    required(path, { message: 'Choose a size' });
  });
}
