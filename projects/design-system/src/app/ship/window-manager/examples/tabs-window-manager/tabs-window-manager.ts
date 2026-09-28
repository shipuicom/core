import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipWindow, ShipWindowManager } from '@ship-ui/core/ship-window-manager';

@Component({
  selector: 'app-tabs-window-manager',
  standalone: true,
  imports: [ShipWindowManager, ShipWindow],
  templateUrl: './tabs-window-manager.html',
  styleUrl: './tabs-window-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsWindowManager {}
