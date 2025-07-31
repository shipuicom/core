import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipToggleCardComponent } from 'ship-ui';

@Component({
  selector: 'app-toggle-card-disallowed-example',
  standalone: true,
  imports: [ShipToggleCardComponent],
  templateUrl: './toggle-card-disallowed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleCardDisallowedExampleComponent {}
