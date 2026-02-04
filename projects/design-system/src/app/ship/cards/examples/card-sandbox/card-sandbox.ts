import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup, ShipCard, ShipToggle, ShipToggleCard } from 'ship-ui';

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
  disallowToggle = signal<boolean>(false);
}
