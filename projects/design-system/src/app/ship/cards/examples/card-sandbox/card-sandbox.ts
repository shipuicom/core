import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { ShipToggleCard } from '@ship-ui/core/ship-toggle-card';

@Component({
  selector: 'app-card-sandbox',
  imports: [ShipCard, ShipToggleCard, ShipButtonGroup, ShipToggle],
  templateUrl: './card-sandbox.html',
  styleUrl: './card-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSandbox {
  cardType = signal<'type-a' | 'type-b' | 'type-c'>('type-a');
  useToggleCard = signal<boolean>(false);
  disableToggle = signal<boolean>(false);
}
