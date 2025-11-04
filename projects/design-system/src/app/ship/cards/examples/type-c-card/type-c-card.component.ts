import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCard } from 'ship-ui';

@Component({
  selector: 'app-type-c-card',
  standalone: true,
  imports: [ShipCard],
  templateUrl: './type-c-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeCCardComponent {}
