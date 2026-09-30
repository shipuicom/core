import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ShipColor,
  ShipLayoutAchievementVariant,
  ShipLayoutDetailsVariant,
  ShipLayoutInboxVariant,
  ShipLayoutTableViewVariant,
  ShipLayoutEmptyStateVariant,
  ShipLayoutPageSize,
  ShipLayoutPageVariant,
  ShipLayoutSectionVariant,
  ShipLayoutSettingVariant,
  ShipLayoutRankingVariant,
  ShipLayoutStatGoalVariant,
  ShipLayoutStatRingVariant,
  ShipLayoutStatTrendVariant,
  ShipLayoutStatVariant,
  ShipLayoutTimelineVariant,
  ShipLayoutToolbarVariant,
} from '@ship-ui/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipColorPicker } from '@ship-ui/core/ship-color-picker';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { EmptyStateSandbox } from './examples/empty-state-sandbox/empty-state-sandbox';
import { PageSandbox } from './examples/page-sandbox/page-sandbox';
import { SectionSandbox } from './examples/section-sandbox/section-sandbox';
import { SettingSandbox } from './examples/setting-sandbox/setting-sandbox';
import { StatSandbox } from './examples/stat-sandbox/stat-sandbox';
import { StatTrendSandbox } from './examples/stat-trend-sandbox/stat-trend-sandbox';
import { StatGoalSandbox } from './examples/stat-goal-sandbox/stat-goal-sandbox';
import { StatRingSandbox } from './examples/stat-ring-sandbox/stat-ring-sandbox';
import { InboxSandbox } from './examples/inbox-sandbox/inbox-sandbox';
import { TableViewSandbox } from './examples/table-view-sandbox/table-view-sandbox';
import { AchievementSandbox } from './examples/achievement-sandbox/achievement-sandbox';
import { RankingSandbox } from './examples/ranking-sandbox/ranking-sandbox';
import { DetailsSandbox } from './examples/details-sandbox/details-sandbox';
import { TimelineSandbox } from './examples/timeline-sandbox/timeline-sandbox';
import { ToolbarSandbox } from './examples/toolbar-sandbox/toolbar-sandbox';

@Component({
  selector: 'app-layouts-examples',
  imports: [
    Previewer,
    ShipButtonGroup,
    ShipToggle,
    ShipColorPicker,
    PageSandbox,
    SectionSandbox,
    SettingSandbox,
    EmptyStateSandbox,
    ToolbarSandbox,
    StatSandbox,
    StatTrendSandbox,
    StatGoalSandbox,
    StatRingSandbox,
    RankingSandbox,
    AchievementSandbox,
    InboxSandbox,
    TableViewSandbox,
    DetailsSandbox,
    TimelineSandbox,
  ],
  templateUrl: './layouts-examples.html',
  styleUrl: './layouts-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LayoutsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  pageVariant = signal<ShipLayoutPageVariant>('');
  pageSize = signal<ShipLayoutPageSize>('');
  sectionVariant = signal<ShipLayoutSectionVariant>('');
  settingVariant = signal<ShipLayoutSettingVariant>('');
  emptyStateVariant = signal<ShipLayoutEmptyStateVariant>('');
  toolbarVariant = signal<ShipLayoutToolbarVariant>('');
  statVariant = signal<ShipLayoutStatVariant>('');
  statTrendVariant = signal<ShipLayoutStatTrendVariant>('');
  statGoalVariant = signal<ShipLayoutStatGoalVariant>('');
  statRingVariant = signal<ShipLayoutStatRingVariant>('');
  inboxVariant = signal<ShipLayoutInboxVariant>('');
  inboxReadingPane = signal(true);
  tableViewVariant = signal<ShipLayoutTableViewVariant>('type-b');
  achievementVariant = signal<ShipLayoutAchievementVariant>('');
  achievementColor = signal<ShipColor>('primary');
  achievementMedia = signal<'icon' | 'image'>('icon');
  achievementLocked = signal(true);
  achievementDynamic = signal(false);
  achievementPickedColor = signal<[number, number, number]>([168, 85, 247]);
  achievementCurrentColor = signal<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number } | null>(
    null
  );
  rankingVariant = signal<ShipLayoutRankingVariant>('');
  detailsVariant = signal<ShipLayoutDetailsVariant>('');
  timelineVariant = signal<ShipLayoutTimelineVariant>('');
}
