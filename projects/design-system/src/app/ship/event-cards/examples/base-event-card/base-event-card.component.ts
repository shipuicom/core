import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipEventCardComponent } from 'ship-ui';

@Component({
  selector: 'app-base-event-card',
  imports: [ShipEventCardComponent, ShipButtonComponent],
  templateUrl: './base-event-card.component.html',
  styleUrl: './base-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseEventCardComponent {}
