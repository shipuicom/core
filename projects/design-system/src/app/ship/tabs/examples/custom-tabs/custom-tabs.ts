import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon, ShipTabs } from 'ship-ui';
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
