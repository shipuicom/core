import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggleComponent } from '@ship-ui/core';

@Component({
  selector: 'app-raised-toggle',
  standalone: true,
  imports: [ShipToggleComponent],
  templateUrl: './raised-toggle.component.html',
  styleUrl: './raised-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedToggleComponent {
  active = signal(false);
}
