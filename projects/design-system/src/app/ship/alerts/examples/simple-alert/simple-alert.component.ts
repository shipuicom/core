import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlertComponent } from 'ship-ui';

@Component({
  selector: 'app-simple-alert',
  standalone: true,
  imports: [ShipAlertComponent],
  templateUrl: './simple-alert.component.html',
  styleUrl: './simple-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleAlertComponent {
  active = signal(false);
}
