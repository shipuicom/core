import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from 'ship-ui';

@Component({
  selector: 'app-raised-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './raised-alert.html',
  styleUrl: './raised-alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedAlert {
  active = signal(false);
}
