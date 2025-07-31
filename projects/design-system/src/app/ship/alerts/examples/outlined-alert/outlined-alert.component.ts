import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlertComponent } from 'ship-ui';

@Component({
  selector: 'app-outlined-alert',
  standalone: true,
  imports: [ShipAlertComponent],
  templateUrl: './outlined-alert.component.html',
  styleUrl: './outlined-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedAlertComponent {
  active = signal(false);
}
