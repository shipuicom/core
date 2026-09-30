import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-layouts-api',
  imports: [ApiReference],
  template: `
    @for (name of names; track name) {
      <app-api-reference [name]="name" />
    }
  `,
  styleUrl: './layouts-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LayoutsApi {
  names = [
    'ShipLayoutPage',
    'ShipLayoutSection',
    'ShipLayoutSetting',
    'ShipLayoutEmptyState',
    'ShipLayoutToolbar',
    'ShipLayoutStat',
    'ShipLayoutStatTrend',
    'ShipLayoutStatGoal',
    'ShipLayoutStatRing',
    'ShipLayoutRanking',
    'ShipLayoutRankingItem',
    'ShipLayoutAchievement',
    'ShipLayoutInbox',
    'ShipLayoutInboxItem',
    'ShipLayoutTableView',
    'ShipLayoutDetails',
    'ShipLayoutDetail',
    'ShipLayoutTimeline',
    'ShipLayoutTimelineItem',
  ];
}
