import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipEventCardComponent } from 'ship-ui';

@Component({
  selector: 'app-flat-event-card',
  imports: [ShipEventCardComponent, ShipButtonComponent],
  templateUrl: './flat-event-card.component.html',
  styleUrl: './flat-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatEventCardComponent {}
