import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-simple-checkbox',
  standalone: true,
  imports: [ShipCheckbox],
  templateUrl: './simple-checkbox.component.html',
  styleUrl: './simple-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleCheckboxComponent {
  active = signal(false);
}
