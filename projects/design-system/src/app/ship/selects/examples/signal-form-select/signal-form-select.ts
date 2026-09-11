import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ShipSelect } from '@ship-ui/core/ship-select';

@Component({
  selector: 'app-signal-form-select',
  imports: [FormField, ShipSelect],
  templateUrl: './signal-form-select.html',
  styleUrl: './signal-form-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFormSelect {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);

  food = signal('');
  foodForm = form(this.food, (path) => {
    required(path, { message: 'Pick a food' });
  });
}
