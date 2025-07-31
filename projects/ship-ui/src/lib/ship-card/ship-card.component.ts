import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SHIP_CONFIG } from '../utilities/ship-config';

@Component({
  selector: 'sh-card',
  imports: [],
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'class()',
  },
})
export class ShipCardComponent {
  #spkConfig = inject(SHIP_CONFIG, { optional: true });
  class = signal<string>(this.#spkConfig?.cardType ?? 'default');
}
