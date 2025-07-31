import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCheckboxComponent } from '@ship-ui/core';

@Component({
  selector: 'app-raised-checkbox',
  standalone: true,
  imports: [ShipCheckboxComponent],
  templateUrl: './raised-checkbox.component.html',
  styleUrl: './raised-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedCheckboxComponent {
  active = signal(false);
}
