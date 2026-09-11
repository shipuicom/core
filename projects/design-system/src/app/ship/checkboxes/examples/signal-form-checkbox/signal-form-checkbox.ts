import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { disabled, form, FormField, validate } from '@angular/forms/signals';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';

@Component({
  selector: 'app-signal-form-checkbox',
  imports: [JsonPipe, FormField, ShipCheckbox],
  templateUrl: './signal-form-checkbox.html',
  styleUrl: './signal-form-checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFormCheckbox {
  prefs = signal({
    terms: false,
    newsletter: true,
    beta: false,
  });

  prefsForm = form(this.prefs, (path) => {
    validate(path.terms, ({ value }) => (value() ? undefined : { kind: 'terms', message: 'You must accept the terms' }));
    // Beta access only makes sense for newsletter subscribers.
    disabled(path.beta, ({ valueOf }) => !valueOf(path.newsletter));
  });
}
