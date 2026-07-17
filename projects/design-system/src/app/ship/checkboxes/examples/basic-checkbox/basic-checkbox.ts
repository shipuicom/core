import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';

@Component({
  selector: 'app-basic-checkbox',
  standalone: true,
  imports: [ShipCheckbox],
  templateUrl: './basic-checkbox.html',
  styleUrl: './basic-checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicCheckbox {
  active = signal(false);
}
