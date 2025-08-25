import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIconComponent, ShipTabsComponent } from 'ship-ui';
import TabComponent from '../../tab/tab.component';

@Component({
  selector: 'app-custom-tabs',
  standalone: true,
  imports: [ShipTabsComponent, ShipIconComponent, TabComponent],
  templateUrl: './custom-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTabsComponent {
  activeTab = signal('tab1');
}
