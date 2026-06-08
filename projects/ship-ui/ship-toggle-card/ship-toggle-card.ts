import { ChangeDetectionStrategy, Component, effect, input, model, ViewEncapsulation } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipCardVariant, ShipColor } from '@ship-ui/core';

@Component({
  selector: 'sh-toggle-card',
  styleUrl: './ship-toggle-card.scss',
  encapsulation: ViewEncapsulation.None,
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
  isActive = model<boolean>(false);

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
