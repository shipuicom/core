import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipCard } from 'ship-ui';

@Component({
  selector: 'app-base-card',
  imports: [ShipCard, ShipButton],
  templateUrl: './base-card.html',
  styleUrl: './base-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCardComponent {}
