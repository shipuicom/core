import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCard } from '@ship-ui/core/ship-card';

@Component({
  selector: 'app-type-b-card',
  standalone: true,
  imports: [ShipCard],
  templateUrl: './type-b-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeBCardComponent {}
