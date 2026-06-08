import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from '@ship-ui/core/ship-alert';

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
