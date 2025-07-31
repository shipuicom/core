import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggleComponent } from 'ship-ui';

@Component({
  selector: 'app-base-toggle',
  standalone: true,
  imports: [ShipToggleComponent],
  templateUrl: './base-toggle.component.html',
  styleUrl: './base-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseToggleComponent {
  active = signal(false);
}
