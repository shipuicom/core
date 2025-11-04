import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-outlined-checkbox',
  standalone: true,
  imports: [ShipCheckbox],
  templateUrl: './outlined-checkbox.component.html',
  styleUrl: './outlined-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedCheckboxComponent {
  active = signal(false);
}
