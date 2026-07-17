import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipEventCard } from '@ship-ui/core/ship-event-card';

@Component({
  selector: 'app-basic-event-card',
  standalone: true,
  imports: [ShipEventCard, ShipButton],
  templateUrl: './basic-event-card.html',
  styleUrl: './basic-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicEventCard {}
