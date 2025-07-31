import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckboxComponent } from '@ship-ui/core';

@Component({
  selector: 'app-base-checkbox',
  standalone: true,
  imports: [ShipCheckboxComponent],
  templateUrl: './base-checkbox.component.html',
  styleUrl: './base-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCheckboxComponent {
  active = signal(false);
}
