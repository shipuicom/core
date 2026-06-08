import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
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
