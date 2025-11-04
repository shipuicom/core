import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon, ShipTabsComponent } from 'ship-ui';
import TabComponent from '../../tab/tab.component';

@Component({
  selector: 'app-custom-tabs',
  standalone: true,
  imports: [ShipTabsComponent, ShipIcon, TabComponent],
  templateUrl: './custom-tabs.component.html',
  styleUrls: ['./custom-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTabsComponent {
  activeTab = signal('tab1');
}
