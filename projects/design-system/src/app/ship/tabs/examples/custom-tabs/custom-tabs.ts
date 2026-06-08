import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import Tab from '../../tab/tab';

@Component({
  selector: 'app-custom-tabs',
  standalone: true,
  imports: [ShipTabs, ShipIcon, Tab],
  templateUrl: './custom-tabs.html',
  styleUrls: ['./custom-tabs.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTabsComponent {
  activeTab = signal('tab1');
}
