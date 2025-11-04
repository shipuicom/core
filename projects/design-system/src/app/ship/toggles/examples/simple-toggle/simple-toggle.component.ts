import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-simple-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './simple-toggle.component.html',
  styleUrl: './simple-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleToggleComponent {
  active = signal(false);
}
