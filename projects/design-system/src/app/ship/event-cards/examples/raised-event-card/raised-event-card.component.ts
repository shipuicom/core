import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCardComponent } from 'ship-ui';

@Component({
  selector: 'app-raised-event-card',
  imports: [ShipEventCardComponent, ShipButton],
  templateUrl: './raised-event-card.component.html',
  styleUrl: './raised-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedEventCardComponent {}
