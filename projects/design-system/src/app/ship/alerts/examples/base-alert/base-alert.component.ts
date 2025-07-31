import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlertComponent } from 'ship-ui';

@Component({
  selector: 'app-base-alert',
  standalone: true,
  imports: [ShipAlertComponent],
  templateUrl: './base-alert.component.html',
  styleUrl: './base-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseAlertComponent {
  active = signal(false);
}
