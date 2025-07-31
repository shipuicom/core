import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIconComponent, ShipTabsComponent } from '@ship-ui/core';
import TabComponent from '../../tab/tab.component';

@Component({
  selector: 'app-default-tabs',
  standalone: true,
  imports: [ShipTabsComponent, ShipIconComponent, TabComponent],
  templateUrl: './default-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultTabsComponent {
  activeTab = signal('tab1');
}
