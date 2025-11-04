import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipEventCardComponent } from 'ship-ui';

@Component({
  selector: 'app-base-event-card',
  imports: [ShipEventCardComponent, ShipButton],
  templateUrl: './base-event-card.component.html',
  styleUrl: './base-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseEventCardComponent {}
