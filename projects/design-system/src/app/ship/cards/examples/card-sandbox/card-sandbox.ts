import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipCardVariant } from '@ship-ui/core';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipToggleCard } from '@ship-ui/core/ship-toggle-card';

@Component({
  selector: 'app-card-sandbox',
  imports: [ShipCard, ShipToggleCard],
  templateUrl: './card-sandbox.html',
  styleUrl: './card-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSandbox {
  variant = input<ShipCardVariant>('type-a');
  disableToggle = input(false);
}
