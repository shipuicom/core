import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

@Component({
  selector: 'app-basic-toggle',
  standalone: true,
  imports: [ShipToggle],
  templateUrl: './basic-toggle.html',
  styleUrl: './basic-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicToggle {
  active = signal(false);
}
