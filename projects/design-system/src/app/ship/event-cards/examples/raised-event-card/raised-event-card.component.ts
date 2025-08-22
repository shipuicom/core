import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipEventCardComponent } from 'ship-ui';

@Component({
  selector: 'app-raised-event-card',
  imports: [ShipEventCardComponent, ShipButtonComponent],
  templateUrl: './raised-event-card.component.html',
  styleUrl: './raised-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedEventCardComponent {}
