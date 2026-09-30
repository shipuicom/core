import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';
import { ShipLayoutPage, ShipLayoutSection, ShipLayoutStat } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-dashboard-page-example',
  imports: [
    ShipLayoutPage,
    ShipLayoutSection,
    ShipLayoutStat,
    ShipCard,
    ShipButton,
    ShipIcon,
    ShipChip,
    ShipChartSparkline,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageExample {
  kpis = [
    { label: 'Visitors', value: '48.2k', delta: '+12%', up: true, trend: [12, 18, 14, 22, 26, 24, 31, 35] },
    { label: 'Signups', value: '1,284', delta: '+4%', up: true, trend: [8, 9, 7, 11, 10, 12, 13, 14] },
    { label: 'Revenue', value: '$32.9k', delta: '-2%', up: false, trend: [40, 38, 41, 36, 34, 30, 32, 29] },
    { label: 'Churn', value: '1.8%', delta: '-0.3%', up: true, trend: [3, 2.8, 2.6, 2.4, 2.3, 2.1, 1.9, 1.8] },
  ];

  pages = [
    { path: '/pricing', views: '12,403' },
    { path: '/docs/getting-started', views: '9,871' },
    { path: '/blog/launch-week', views: '6,220' },
    { path: '/changelog', views: '3,115' },
  ];

  activity = [
    { text: 'Report "Q3 funnel" exported', when: '2 minutes ago' },
    { text: 'Alex invited 3 teammates', when: '1 hour ago' },
    { text: 'Goal "1k signups" reached', when: 'Yesterday' },
  ];
}
