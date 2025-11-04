import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCard } from 'ship-ui';

@Component({
  selector: 'app-outlined-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './outlined-event-card.html',
  styleUrl: './outlined-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedEventCard {}
