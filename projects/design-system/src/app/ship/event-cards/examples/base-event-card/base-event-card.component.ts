import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCard } from 'ship-ui';

@Component({
  selector: 'app-base-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './base-event-card.component.html',
  styleUrl: './base-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseEventCardComponent {}
