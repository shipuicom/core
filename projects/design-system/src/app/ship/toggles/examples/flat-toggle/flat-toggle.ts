import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-flat-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './flat-toggle.html',
  styleUrl: './flat-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatToggle {
  active = signal(false);
}
