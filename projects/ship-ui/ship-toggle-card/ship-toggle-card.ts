import { ChangeDetectionStrategy, Component, effect, inject, input, model, ViewEncapsulation } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipCardVariant, ShipColor } from '@ship-ui/core';

@Component({
  selector: 'sh-toggle-card',
  styleUrl: './ship-toggle-card.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  template: `
    <h3
      role="button"
      [attr.tabindex]="disableToggle() ? null : '0'"
      [attr.aria-expanded]="disableToggle() ? null : (isActive() ? 'true' : 'false')"
      [attr.aria-disabled]="disableToggle() ? 'true' : null"
      (click)="!disableToggle() && toggle()"
      (keydown)="!disableToggle() && handleKeyDown($event)">
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
  #keybindings = inject(ShipA11yKeybindingsService);

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

  handleKeyDown(event: KeyboardEvent) {
    if (this.#keybindings.matches(event, 'toggle-card.toggle')) {
      event.preventDefault();
      this.toggle();
    }
  }
}
