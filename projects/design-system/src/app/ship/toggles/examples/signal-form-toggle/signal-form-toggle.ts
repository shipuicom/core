import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { disabled, form, FormField } from '@angular/forms/signals';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

@Component({
  selector: 'app-signal-form-toggle',
  imports: [JsonPipe, FormField, ShipToggle],
  templateUrl: './signal-form-toggle.html',
  styleUrl: './signal-form-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFormToggle {
  settings = signal({
    notifications: true,
    sound: false,
  });

  settingsForm = form(this.settings, (path) => {
    // Sound can only be toggled while notifications are on.
    disabled(path.sound, ({ valueOf }) => !valueOf(path.notifications));
  });
}
