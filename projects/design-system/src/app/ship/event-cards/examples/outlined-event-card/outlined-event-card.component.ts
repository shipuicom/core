import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipEventCardComponent } from 'ship-ui';

@Component({
  selector: 'app-outlined-event-card',
  imports: [ShipEventCardComponent, ShipButtonComponent],
  templateUrl: './outlined-event-card.component.html',
  styleUrl: './outlined-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedEventCardComponent {}
