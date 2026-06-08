import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipEventCard } from '@ship-ui/core/ship-event-card';

@Component({
  selector: 'app-base-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './base-event-card.html',
  styleUrl: './base-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseEventCard {}
