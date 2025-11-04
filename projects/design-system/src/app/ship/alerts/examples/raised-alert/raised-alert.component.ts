import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from 'ship-ui';

@Component({
  selector: 'app-raised-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './raised-alert.component.html',
  styleUrl: './raised-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedAlertComponent {
  active = signal(false);
}
