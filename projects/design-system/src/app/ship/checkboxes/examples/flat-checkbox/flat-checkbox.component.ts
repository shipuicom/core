import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckboxComponent } from '@ship-ui/core';

@Component({
  selector: 'app-flat-checkbox',
  standalone: true,
  imports: [ShipCheckboxComponent],
  templateUrl: './flat-checkbox.component.html',
  styleUrl: './flat-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatCheckboxComponent {
  active = signal(false);
}
