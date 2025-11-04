import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipToggleCard } from 'ship-ui';

@Component({
  selector: 'app-toggle-card-example',
  standalone: true,
  imports: [ShipToggleCard],
  templateUrl: './toggle-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleCardExampleComponent {}
