import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipButtonGroupComponent, ShipIconComponent, ShipTabsComponent } from 'ship-ui';
import TabComponent from '../../tab/tab.component';

@Component({
  selector: 'app-tabs-sandbox',
  standalone: true,
  imports: [ShipTabsComponent, ShipIconComponent, ShipButtonGroupComponent, TabComponent],
  templateUrl: './tabs-sandbox.component.html',
  styleUrl: './tabs-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsSandboxComponent {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');
  tabsClass = computed(() => (this.colorClass() === '' ? '' : this.colorClass()));
  activeTab = signal('tab1');
}
