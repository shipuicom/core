import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipWindow, ShipWindowManager, ShipWindowMode } from '@ship-ui/core/ship-window-manager';

@Component({
  selector: 'app-basic-window-manager',
  standalone: true,
  imports: [ShipWindowManager, ShipWindow, ShipButtonGroup],
  templateUrl: './basic-window-manager.html',
  styleUrl: './basic-window-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicWindowManager {
  mode = signal<ShipWindowMode>('grid');
}
