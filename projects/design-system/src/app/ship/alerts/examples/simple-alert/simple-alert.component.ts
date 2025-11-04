import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from 'ship-ui';

@Component({
  selector: 'app-simple-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './simple-alert.component.html',
  styleUrl: './simple-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleAlertComponent {
  active = signal(false);
}
