import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutTimelineVariant } from '@ship-ui/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutTimeline, ShipLayoutTimelineItem } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-timeline-sandbox',
  imports: [ShipLayoutTimeline, ShipLayoutTimelineItem, ShipCard, ShipAvatar, ShipIcon],
  templateUrl: './timeline-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineSandbox {
  variant = input<ShipLayoutTimelineVariant>('');
}
