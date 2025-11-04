import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-base-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './base-toggle.html',
  styleUrl: './base-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseToggle {
  active = signal(false);
}
