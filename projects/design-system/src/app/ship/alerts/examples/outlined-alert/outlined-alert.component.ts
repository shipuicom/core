import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from 'ship-ui';

@Component({
  selector: 'app-outlined-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './outlined-alert.component.html',
  styleUrl: './outlined-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedAlertComponent {
  active = signal(false);
}
