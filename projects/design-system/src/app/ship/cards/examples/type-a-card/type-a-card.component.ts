import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCardComponent } from 'ship-ui';

@Component({
  selector: 'app-type-a-card',
  standalone: true,
  imports: [ShipCardComponent],
  templateUrl: './type-a-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeACardComponent {}
