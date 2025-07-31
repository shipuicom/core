import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCardComponent } from '@ship-ui/core';

@Component({
  selector: 'app-type-c-card',
  standalone: true,
  imports: [ShipCardComponent],
  templateUrl: './type-c-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeCCardComponent {}
