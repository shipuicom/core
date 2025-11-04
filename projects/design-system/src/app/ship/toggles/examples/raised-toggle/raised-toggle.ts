import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-raised-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './raised-toggle.html',
  styleUrl: './raised-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedToggle {
  active = signal(false);
}
