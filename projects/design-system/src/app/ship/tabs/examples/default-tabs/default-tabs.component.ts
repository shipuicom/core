import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon, ShipTabs } from 'ship-ui';
import TabComponent from '../../tab/tab.component';

@Component({
  selector: 'app-default-tabs',
  standalone: true,
  imports: [ShipTabs, ShipIcon, TabComponent],
  templateUrl: './default-tabs.component.html',
  styleUrls: ['./default-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultTabsComponent {
  activeTab = signal('tab1');
}
