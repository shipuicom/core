import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipEventCard } from '@ship-ui/core/ship-event-card';

@Component({
  selector: 'app-outlined-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './outlined-event-card.html',
  styleUrl: './outlined-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedEventCard {}
