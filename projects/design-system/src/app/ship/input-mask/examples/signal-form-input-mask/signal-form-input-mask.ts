import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, pattern, required } from '@angular/forms/signals';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipInputMask } from '@ship-ui/core/ship-input-mask';

@Component({
  selector: 'app-signal-form-input-mask',
  imports: [JsonPipe, FormField, ShipFormField, ShipIcon, ShipInputMask],
  templateUrl: './signal-form-input-mask.html',
  styleUrl: './signal-form-input-mask.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFormInputMask {
  contact = signal({ phone: '', card: '' });

  contactForm = form(this.contact, (path) => {
    required(path.phone, { message: 'Phone is required' });
    pattern(path.phone, /^\(\d{3}\) \d{3}-\d{4}$/, { message: 'Complete the phone number' });
    pattern(path.card, /^(\d{4} ){3}\d{4}$/, { message: 'Complete the card number' });
  });
}
