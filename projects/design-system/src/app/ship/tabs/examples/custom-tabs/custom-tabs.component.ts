import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon, ShipTabs } from 'ship-ui';
import TabComponent from '../../tab/tab.component';

@Component({
  selector: 'app-custom-tabs',
  standalone: true,
  imports: [ShipTabs, ShipIcon, TabComponent],
  templateUrl: './custom-tabs.component.html',
  styleUrls: ['./custom-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTabsComponent {
  activeTab = signal('tab1');
}
