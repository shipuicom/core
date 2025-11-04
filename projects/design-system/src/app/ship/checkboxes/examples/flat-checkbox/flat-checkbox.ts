import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-flat-checkbox',
  standalone: true,
  imports: [ShipCheckbox],
  templateUrl: './flat-checkbox.html',
  styleUrl: './flat-checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatCheckbox {
  active = signal(false);
}
