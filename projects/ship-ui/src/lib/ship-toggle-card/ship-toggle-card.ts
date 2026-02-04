import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { ShipIcon } from '../ship-icon/ship-icon';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipCardVariant, ShipColor } from '../utilities/ship-types';

@Component({
  selector: 'sh-toggle-card',
  imports: [ShipIcon],
  template: `
    <h3 (click)="disallowToggle() || toggle()">
      <ng-content select="[title]">Title</ng-content>

      @if (!disallowToggle()) {
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
  isActive = model(false);
  disallowToggle = input(false);

  color = input<ShipColor | null>(null);
  variant = input<ShipCardVariant | null>(null);
  hostClasses = shipComponentClasses('card', {
    color: this.color,
    variant: this.variant,
  });

  ngOnInit() {
    if (this.disallowToggle()) {
      this.isActive.set(true);
    }
  }

  toggle() {
    this.isActive.set(!this.isActive());
  }
}
