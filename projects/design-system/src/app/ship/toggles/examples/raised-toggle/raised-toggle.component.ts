import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-raised-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './raised-toggle.component.html',
  styleUrl: './raised-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedToggleComponent {
  active = signal(false);
}
