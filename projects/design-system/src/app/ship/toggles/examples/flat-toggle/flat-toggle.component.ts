import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-flat-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './flat-toggle.component.html',
  styleUrl: './flat-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatToggleComponent {
  active = signal(false);
}
