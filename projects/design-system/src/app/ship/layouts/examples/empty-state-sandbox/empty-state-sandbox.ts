import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutEmptyStateVariant } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutEmptyState } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-empty-state-sandbox',
  imports: [ShipLayoutEmptyState, ShipCard, ShipButton, ShipIcon],
  templateUrl: './empty-state-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateSandbox {
  variant = input<ShipLayoutEmptyStateVariant>('');
}
