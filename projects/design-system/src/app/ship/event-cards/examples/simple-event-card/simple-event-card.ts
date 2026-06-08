import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipEventCard } from '@ship-ui/core/ship-event-card';

@Component({
  selector: 'app-simple-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './simple-event-card.html',
  styleUrl: './simple-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleEventCard {}
