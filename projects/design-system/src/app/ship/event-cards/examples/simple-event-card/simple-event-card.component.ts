import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipEventCardComponent } from 'ship-ui';

@Component({
  selector: 'app-simple-event-card',
  imports: [ShipEventCardComponent, ShipButtonComponent],
  templateUrl: './simple-event-card.component.html',
  styleUrl: './simple-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleEventCardComponent {}
