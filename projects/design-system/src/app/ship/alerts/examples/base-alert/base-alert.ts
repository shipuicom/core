import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert } from '@ship-ui/core/ship-alert';
import { ShipButton } from '@ship-ui/core/ship-button';

@Component({
  selector: 'app-base-alert',
  standalone: true,
  imports: [ShipAlert, ShipButton],
  templateUrl: './base-alert.html',
  styleUrl: './base-alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseAlert {
  active = signal(false);
}
