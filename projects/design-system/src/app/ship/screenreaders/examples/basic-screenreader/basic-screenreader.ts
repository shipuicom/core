import { Component, inject, signal } from '@angular/core';
import { ShipScreenreader } from '@ship-ui/core/ship-screenreader';
import { ShipA11yAnnouncerService } from '@ship-ui/core/ship-a11y-announcer';

@Component({
  selector: 'basic-screenreader-example',
  standalone: true,
  imports: [ShipScreenreader],
  templateUrl: './basic-screenreader.html',
  styleUrl: './basic-screenreader.scss',
})
export class BasicScreenreader {
  #announcer = inject(ShipA11yAnnouncerService);

  expanded = signal(false);
  saved = signal(0);

  toggle() {
    this.expanded.update((value) => !value);
  }

  save() {
    this.saved.update((count) => count + 1);
    this.#announcer.announce(`Draft saved (${this.saved()})`);
  }
}
