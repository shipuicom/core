import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-base-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './base-toggle.component.html',
  styleUrl: './base-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseToggleComponent {
  active = signal(false);
}
