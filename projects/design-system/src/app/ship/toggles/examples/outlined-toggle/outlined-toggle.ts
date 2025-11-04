import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-outlined-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './outlined-toggle.html',
  styleUrl: './outlined-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedToggle {
  active = signal(false);
}
