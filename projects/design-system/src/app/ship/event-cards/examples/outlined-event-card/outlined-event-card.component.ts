import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCard } from 'ship-ui';

@Component({
  selector: 'app-outlined-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './outlined-event-card.component.html',
  styleUrl: './outlined-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedEventCardComponent {}
