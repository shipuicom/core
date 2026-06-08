import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';

@Component({
  selector: 'app-base-card',
  imports: [ShipCard, ShipButton],
  templateUrl: './base-card.html',
  styleUrl: './base-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCardComponent {}
