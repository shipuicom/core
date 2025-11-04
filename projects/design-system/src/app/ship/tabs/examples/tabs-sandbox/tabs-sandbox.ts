import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipButtonGroup, ShipIcon, ShipTabs } from 'ship-ui';
import Tab from '../../tab/tab';

@Component({
  selector: 'app-tabs-sandbox',
  standalone: true,
  imports: [ShipTabs, ShipIcon, ShipButtonGroup, Tab],
  templateUrl: './tabs-sandbox.html',
  styleUrl: './tabs-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsSandbox {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');
  tabsClass = computed(() => (this.colorClass() === '' ? '' : this.colorClass()));
  activeTab = signal('tab1');
}
