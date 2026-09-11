import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { disabled, email, form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-signal-form-field',
  imports: [JsonPipe, FormField, ShipFormField, ShipIcon],
  templateUrl: './signal-form-field.html',
  styleUrl: './signal-form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFormField {
  profile = signal({
    name: '',
    email: '',
    bio: '',
    locked: 'Cannot edit me',
  });

  profileForm = form(this.profile, (path) => {
    required(path.name, { message: 'Name is required' });
    maxLength(path.name, 10, { message: 'Max 10 characters' });
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Enter a valid email' });
    minLength(path.bio, 20, { message: 'Tell us a bit more (min 20 chars)' });
    disabled(path.locked);
  });
}
