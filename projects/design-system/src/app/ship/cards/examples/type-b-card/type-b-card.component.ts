import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCardComponent } from '@ship-ui/core';

@Component({
  selector: 'app-type-b-card',
  standalone: true,
  imports: [ShipCardComponent],
  templateUrl: './type-b-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeBCardComponent {}
