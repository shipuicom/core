import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipWindow, ShipWindowManager } from '@ship-ui/core/ship-window-manager';

@Component({
  selector: 'app-grid-move-window-manager',
  standalone: true,
  imports: [ShipWindowManager, ShipWindow],
  templateUrl: './grid-move-window-manager.html',
  styleUrl: './grid-move-window-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridMoveWindowManager {}
