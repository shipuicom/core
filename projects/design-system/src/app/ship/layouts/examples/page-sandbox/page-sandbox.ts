import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipLayoutPageSize, ShipLayoutPageVariant } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import {
  ShipLayoutDetail,
  ShipLayoutDetails,
  ShipLayoutPage,
  ShipLayoutSection,
  ShipLayoutStat,
  ShipLayoutTimeline,
  ShipLayoutTimelineItem,
} from '@ship-ui/core/ship-layout';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-page-sandbox',
  imports: [
    ShipLayoutPage,
    ShipLayoutSection,
    ShipLayoutStat,
    ShipLayoutDetails,
    ShipLayoutDetail,
    ShipLayoutTimeline,
    ShipLayoutTimelineItem,
    ShipTabs,
    ShipCard,
    ShipChip,
    ShipButton,
    ShipIcon,
  ],
  templateUrl: './page-sandbox.html',
  styleUrl: './page-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSandbox {
  variant = input<ShipLayoutPageVariant>('');
  size = input<ShipLayoutPageSize>('');
  tab = signal('overview');
}
