import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipWindow, ShipWindowManager } from '@ship-ui/core/ship-window-manager';

@Component({
  selector: 'app-grid-window-manager',
  standalone: true,
  imports: [ShipWindowManager, ShipWindow],
  templateUrl: './grid-window-manager.html',
  styleUrl: './grid-window-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridWindowManager {}
