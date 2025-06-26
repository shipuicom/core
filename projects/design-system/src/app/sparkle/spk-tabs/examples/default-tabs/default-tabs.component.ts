import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleIconComponent, SparkleTabsComponent } from '../../../../../../../sparkle-ui/src/public-api';
import TabComponent from '../../tab/tab.component';

@Component({
  selector: 'app-default-tabs',
  standalone: true,
  imports: [SparkleTabsComponent, SparkleIconComponent, TabComponent],
  templateUrl: './default-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultTabsComponent {
  activeTab = signal('tab1');
}
