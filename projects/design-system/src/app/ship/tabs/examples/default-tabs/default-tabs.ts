import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon, ShipTabs } from 'ship-ui';
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
