import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from 'ship-ui';

@Component({
  selector: 'app-flat-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './flat-alert.html',
  styleUrl: './flat-alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatAlert {
  active = signal(false);
}
