import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from 'ship-ui';

@Component({
  selector: 'app-base-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './base-alert.html',
  styleUrl: './base-alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseAlert {
  active = signal(false);
}
