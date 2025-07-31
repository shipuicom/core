import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggleComponent } from '@ship-ui/core';

@Component({
  selector: 'app-flat-toggle',
  standalone: true,
  imports: [ShipToggleComponent],
  templateUrl: './flat-toggle.component.html',
  styleUrl: './flat-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatToggleComponent {
  active = signal(false);
}
