import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggleComponent } from 'ship-ui';

@Component({
  selector: 'app-simple-toggle',
  standalone: true,
  imports: [ShipToggleComponent],
  templateUrl: './simple-toggle.component.html',
  styleUrl: './simple-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleToggleComponent {
  active = signal(false);
}
