import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckboxComponent } from '@ship-ui/core';

@Component({
  selector: 'app-simple-checkbox',
  standalone: true,
  imports: [ShipCheckboxComponent],
  templateUrl: './simple-checkbox.component.html',
  styleUrl: './simple-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleCheckboxComponent {
  active = signal(false);
}
