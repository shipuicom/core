import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ShipScreenreader } from '@ship-ui/core/ship-screenreader';
import { ShipA11yAnnouncerService } from '@ship-ui/core/ship-a11y-announcer';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipList } from '@ship-ui/core/ship-list';

@Component({
  selector: 'basic-screenreader-example',
  standalone: true,
  imports: [ShipScreenreader, ShipButton, ShipCheckbox, ShipFormField, ShipList, FormField],
  templateUrl: './basic-screenreader.html',
  styleUrl: './basic-screenreader.scss',
})
export class BasicScreenreader {
  #announcer = inject(ShipA11yAnnouncerService);

  expanded = signal(false);
  saved = signal(0);

  // Signal forms drive the checkbox and email field; the simulator announces
  // the states these produce (checked, required, invalid …).
  terms = signal(true);
  termsForm = form(this.terms);

  email = signal('foo');
  emailForm = form(this.email, (path) => {
    required(path);
  });
  emailInvalid = computed(() => !this.email().includes('@'));

  fruit = signal('apples');

  toggle() {
    this.expanded.update((value) => !value);
  }

  save() {
    this.saved.update((count) => count + 1);
    this.#announcer.announce(`Draft saved (${this.saved()})`);
  }
}
