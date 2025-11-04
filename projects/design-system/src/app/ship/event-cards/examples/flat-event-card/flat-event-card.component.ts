import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCard } from 'ship-ui';

@Component({
  selector: 'app-flat-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './flat-event-card.component.html',
  styleUrl: './flat-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatEventCardComponent {}
