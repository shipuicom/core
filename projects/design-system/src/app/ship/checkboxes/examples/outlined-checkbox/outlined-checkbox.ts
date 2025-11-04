import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-outlined-checkbox',
  standalone: true,
  imports: [ShipCheckbox],
  templateUrl: './outlined-checkbox.html',
  styleUrl: './outlined-checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedCheckbox {
  active = signal(false);
}
