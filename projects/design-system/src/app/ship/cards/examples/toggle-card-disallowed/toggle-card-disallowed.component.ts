import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipToggleCard } from 'ship-ui';

@Component({
  selector: 'app-toggle-card-disallowed-example',
  standalone: true,
  imports: [ShipToggleCard],
  templateUrl: './toggle-card-disallowed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleCardDisallowedExampleComponent {}
