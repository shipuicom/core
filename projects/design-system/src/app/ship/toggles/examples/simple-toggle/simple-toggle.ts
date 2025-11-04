import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-simple-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './simple-toggle.html',
  styleUrl: './simple-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleToggle {
  active = signal(false);
}
