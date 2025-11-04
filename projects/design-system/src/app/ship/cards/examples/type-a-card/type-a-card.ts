import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCard } from 'ship-ui';

@Component({
  selector: 'app-type-a-card',
  standalone: true,
  imports: [ShipCard],
  templateUrl: './type-a-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeACardComponent {}
