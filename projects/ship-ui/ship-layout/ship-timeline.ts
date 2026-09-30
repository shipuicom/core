import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutTimelineVariant } from '@ship-ui/core';

/** Activity feed: a column of `sh-lo-timeline-item`s joined by a line. */
@Component({
  selector: 'sh-lo-timeline',
  styleUrl: './ship-timeline.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutTimeline {
  /** Visual variant: `type-b` no connecting line (plain list), `type-c` compact single-line items. Project default via `ShipConfig.layoutTimeline.variant`. */
  variant = input<ShipLayoutTimelineVariant | null>(null);

  hostClasses = shipComponentClasses('layoutTimeline', { variant: this.variant });
}

/**
 * One event: `sh-avatar`/`sh-icon` as the marker, `b`/`[title]`, `time`,
 * and any further content (e.g. `p`) below.
 */
@Component({
  selector: 'sh-lo-timeline-item',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="marker"><ng-content select="sh-avatar, sh-icon, [marker]" /></div>
    <div class="content">
      <div class="head">
        <ng-content select="b, strong, [title]" />
        <ng-content select="time, [time]" />
      </div>
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipLayoutTimelineItem {}
