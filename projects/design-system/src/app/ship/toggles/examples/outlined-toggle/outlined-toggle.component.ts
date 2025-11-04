import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-outlined-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './outlined-toggle.component.html',
  styleUrl: './outlined-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedToggleComponent {
  active = signal(false);
}
