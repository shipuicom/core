import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from 'ship-ui';

@Component({
  selector: 'app-flat-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './flat-alert.component.html',
  styleUrl: './flat-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatAlertComponent {
  active = signal(false);
}
