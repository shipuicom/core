import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import Tab from '../../tab/tab';

@Component({
  selector: 'app-default-tabs',
  standalone: true,
  imports: [ShipTabs, ShipIcon, Tab],
  templateUrl: './default-tabs.html',
  styleUrls: ['./default-tabs.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultTabsComponent {
  activeTab = signal('tab1');
}
