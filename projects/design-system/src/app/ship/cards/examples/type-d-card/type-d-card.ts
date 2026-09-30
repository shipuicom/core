import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCard } from '@ship-ui/core/ship-card';

@Component({
  selector: 'app-type-d-card',
  standalone: true,
  imports: [ShipCard],
  templateUrl: './type-d-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeDCardComponent {}
