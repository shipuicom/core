import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipToggleCardComponent } from 'ship-ui';

@Component({
  selector: 'app-toggle-card-example',
  standalone: true,
  imports: [ShipToggleCardComponent],
  templateUrl: './toggle-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleCardExampleComponent {}
