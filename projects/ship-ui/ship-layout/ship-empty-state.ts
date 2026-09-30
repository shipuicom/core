import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutEmptyStateVariant } from '@ship-ui/core';

/**
 * Centered "nothing here yet" layout for empty lists, tables and pages:
 * `sh-icon`, `h2`/`h3`, `p` and `[actions]`/`button`s, in that order.
 */
@Component({
  selector: 'sh-lo-empty-state',
  styleUrl: './ship-empty-state.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-content select="sh-icon, [icon], img" />
    <div class="text">
      <ng-content select="h2, h3, [title]" />
      <ng-content select="p, [description]" />
    </div>
    <div class="actions">
      <ng-content select="[actions], button, a" />
    </div>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutEmptyState {
  /** Visual variant (`type-b`, `type-c`, or default). Project default via `ShipConfig.layoutEmptyState.variant`. */
  variant = input<ShipLayoutEmptyStateVariant | null>(null);

  hostClasses = shipComponentClasses('layoutEmptyState', { variant: this.variant });
}
