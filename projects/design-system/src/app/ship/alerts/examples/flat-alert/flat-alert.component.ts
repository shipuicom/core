import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlertComponent } from '@ship-ui/core';

@Component({
  selector: 'app-flat-alert',
  standalone: true,
  imports: [ShipAlertComponent],
  templateUrl: './flat-alert.component.html',
  styleUrl: './flat-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatAlertComponent {
  active = signal(false);
}
