import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCard } from 'ship-ui';

@Component({
  selector: 'app-simple-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './simple-event-card.component.html',
  styleUrl: './simple-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleEventCardComponent {}
