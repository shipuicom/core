import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SHIP_CONFIG } from '../utilities/ship-config';

@Component({
  selector: 'sh-card',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'class()',
  },
})
export class ShipCard {
  #shConfig = inject(SHIP_CONFIG, { optional: true });
  class = signal<string>(this.#shConfig?.cardType ?? 'type-a');
}
