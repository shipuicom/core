import { ChangeDetectionStrategy, Component, effect, input, model } from '@angular/core';
import { ShipIcon } from '../../public-api';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipCardVariant, ShipColor } from '../utilities/ship-types';

@Component({
  selector: 'sh-toggle-card',
  imports: [ShipIcon],
  template: `
    <h3 (click)="!disableToggle() && toggle()">
      <ng-content select="[title]">Title</ng-content>

      @if (!disableToggle()) {
        <sh-icon class="toggle-icon">caret-down</sh-icon>
      }
    </h3>

    <div class="collapsable">
      <div class="content">
        <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'isActive()',
    '[class]': 'hostClasses()',
  },
})
export class ShipToggleCard {
  disableToggle = input(false);
  isActive = model<boolean>();

  #disabledEffect = effect(() => {
    if (this.disableToggle()) {
      this.isActive.set(true);
    }
  });

  color = input<ShipColor | null>(null);
  variant = input<ShipCardVariant | null>(null);
  hostClasses = shipComponentClasses('card', {
    color: this.color,
    variant: this.variant,
  });

  toggle() {
    this.isActive.set(!this.isActive());
  }
}
