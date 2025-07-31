import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggleComponent } from '@ship-ui/core';

@Component({
  selector: 'app-outlined-toggle',
  standalone: true,
  imports: [ShipToggleComponent],
  templateUrl: './outlined-toggle.component.html',
  styleUrl: './outlined-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedToggleComponent {
  active = signal(false);
}
