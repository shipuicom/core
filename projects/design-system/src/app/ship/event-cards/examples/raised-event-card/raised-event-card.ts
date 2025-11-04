import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCard } from 'ship-ui';

@Component({
  selector: 'app-raised-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './raised-event-card.html',
  styleUrl: './raised-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedEventCard {}
