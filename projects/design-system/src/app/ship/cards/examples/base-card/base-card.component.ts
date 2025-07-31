import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCardComponent } from '@ship-ui/core';

@Component({
  selector: 'app-base-card',
  standalone: true,
  imports: [ShipCardComponent],
  templateUrl: './base-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCardComponent {}
