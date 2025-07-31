import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckboxComponent } from '@ship-ui/core';

@Component({
  selector: 'app-outlined-checkbox',
  standalone: true,
  imports: [ShipCheckboxComponent],
  templateUrl: './outlined-checkbox.component.html',
  styleUrl: './outlined-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedCheckboxComponent {
  active = signal(false);
}
