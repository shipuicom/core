import { booleanAttribute, ChangeDetectionStrategy, Component, input, model, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockBannerVariant, ShipColor } from '@ship-ui/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';

/**
 * Announcement bar at the very top of a site: a leading `sh-icon`, the message (default content, may hold `b`/`a`),
 * and a link-style call to action (`[actions]` or a top-level `a`). With `dismissible` it renders its own dismiss
 * button; dismissing sets `open` to false and hides the host.
 */
@Component({
  selector: 'sh-bl-banner',
  styleUrl: './ship-banner.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  template: `
    <div class="inner">
      <ng-content select="sh-icon" />
      <div class="message"><ng-content /></div>
      <div class="actions"><ng-content select="[actions], a" /></div>
      @if (dismissible()) {
        <button type="button" class="dismiss" aria-label="Dismiss" (click)="open.set(false)">
          <sh-icon>x-bold</sh-icon>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.hidden]': 'open() ? null : ""',
  },
})
export class ShipBlockBanner {
  /** Visual variant: default tinted strip, `type-b` solid strip, `type-c` floating pill sized to its content. Project default via `ShipConfig.blockBanner.variant`. */
  variant = input<ShipBlockBannerVariant | null>(null);
  /** Colour (`ShipColor`) of the strip; without one it uses the neutral base steps. */
  color = input<ShipColor | null>(null);
  /** Renders a dismiss button (`aria-label="Dismiss"`) at the end of the bar. */
  dismissible = input(false, { transform: booleanAttribute });
  /** Whether the banner is shown; the dismiss button sets it to false, which hides the host. */
  open = model<boolean>(true);

  hostClasses = shipComponentClasses('blockBanner', { variant: this.variant, color: this.color });
}
