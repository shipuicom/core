import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipEventCard } from '@ship-ui/core/ship-event-card';

@Component({
  selector: 'app-raised-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './raised-event-card.html',
  styleUrl: './raised-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedEventCard {}
