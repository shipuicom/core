import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipEventCard } from '@ship-ui/core/ship-event-card';

@Component({
  selector: 'app-flat-event-card',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './flat-event-card.html',
  styleUrl: './flat-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatEventCard {}
