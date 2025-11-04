import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from 'ship-ui';

@Component({
  selector: 'app-outlined-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './outlined-alert.html',
  styleUrl: './outlined-alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedAlert {
  active = signal(false);
}
