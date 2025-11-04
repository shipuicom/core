import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-simple-checkbox',
  standalone: true,
  imports: [ShipCheckbox],
  templateUrl: './simple-checkbox.html',
  styleUrl: './simple-checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleCheckbox {
  active = signal(false);
}
