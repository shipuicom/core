import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import Tab from '../../tab/tab';

@Component({
  selector: 'app-tabs-sandbox',
  standalone: true,
  imports: [ShipTabs, ShipIcon, Tab],
  templateUrl: './tabs-sandbox.html',
  styleUrl: './tabs-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsSandbox {
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');
  activeTab = signal('tab1');
}
