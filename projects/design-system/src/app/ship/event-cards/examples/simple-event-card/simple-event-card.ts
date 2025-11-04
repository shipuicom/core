import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCard } from 'ship-ui';

@Component({
  selector: 'app-simple-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './simple-event-card.html',
  styleUrl: './simple-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleEventCard {}
