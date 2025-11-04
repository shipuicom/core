import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-flat-checkbox',
  standalone: true,
  imports: [ShipCheckbox],
  templateUrl: './flat-checkbox.component.html',
  styleUrl: './flat-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatCheckboxComponent {
  active = signal(false);
}
