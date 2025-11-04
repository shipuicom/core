import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-base-checkbox',
  standalone: true,
  imports: [ShipCheckbox],
  templateUrl: './base-checkbox.html',
  styleUrl: './base-checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCheckbox {
  active = signal(false);
}
