import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipWindow, ShipWindowManager } from '@ship-ui/core/ship-window-manager';

@Component({
  selector: 'app-dock-window-manager',
  standalone: true,
  imports: [ShipWindowManager, ShipWindow],
  templateUrl: './dock-window-manager.html',
  styleUrl: './dock-window-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockWindowManager {}
