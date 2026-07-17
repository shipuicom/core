import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-basic-tab',
  standalone: true,
  imports: [ShipTabs],
  templateUrl: './basic-tab.html',
  styleUrl: './basic-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicTab {
  activeTab = signal('tab1');
}
