import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from 'ship-ui';

@Component({
  selector: 'app-simple-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './simple-alert.html',
  styleUrl: './simple-alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleAlert {
  active = signal(false);
}
