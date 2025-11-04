import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-base-checkbox',
  standalone: true,
  imports: [ShipCheckbox],
  templateUrl: './base-checkbox.component.html',
  styleUrl: './base-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCheckboxComponent {
  active = signal(false);
}
