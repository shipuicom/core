import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCard } from 'ship-ui';

@Component({
  selector: 'app-flat-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './flat-event-card.html',
  styleUrl: './flat-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatEventCard {}
