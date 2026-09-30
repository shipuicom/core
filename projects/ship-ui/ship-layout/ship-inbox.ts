import { booleanAttribute, ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutInboxVariant } from '@ship-ui/core';

/**
 * Full-page mail client shell. Slots: `[folders]` (the left column: compose
 * button, folder links), `sh-lo-toolbar` (bulk actions above the list),
 * `sh-lo-inbox-item`s (the message list) and an optional `[reader]` pane on
 * the right. With a reader open the list switches to two-line rows; on narrow
 * screens the reader replaces the list and the folders column is hidden.
 * Give it a height (it fills its parent) so the list scrolls on its own.
 */
@Component({
  selector: 'sh-lo-inbox',
  styleUrl: './ship-inbox.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="folders"><ng-content select="[folders]" /></div>
    <div class="list">
      <ng-content select="sh-lo-toolbar, [toolbar]" />
      <div class="items" role="list"><ng-content /></div>
    </div>
    <div class="reader"><ng-content select="[reader]" /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutInbox {
  /** Visual variant: `type-b` list and reader as separate cards, `type-c` compact single-line rows without avatars. Project default via `ShipConfig.layoutInbox.variant`. */
  variant = input<ShipLayoutInboxVariant | null>(null);

  hostClasses = shipComponentClasses('layoutInbox', { variant: this.variant });
}

/**
 * One message row of `sh-lo-inbox`. Slots: `sh-checkbox`, `sh-avatar`,
 * `[from]` (sender), `h4`/`[subject]`, `p` (snippet), `sh-chip`/`[labels]`,
 * `time` and `[star]`. Set `unread` for bold text and an accent bar, and
 * `selected` for the open/checked state.
 */
@Component({
  selector: 'sh-lo-inbox-item',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="select"><ng-content select="sh-checkbox, [select]" /></div>
    <div class="star"><ng-content select="[star]" /></div>
    <div class="avatar"><ng-content select="sh-avatar, [avatar]" /></div>
    <div class="from"><ng-content select="[from]" /></div>
    <div class="message">
      <ng-content select="h4, [subject]" />
      <ng-content select="p, [snippet]" />
    </div>
    <div class="labels"><ng-content select="sh-chip, [labels]" /></div>
    <div class="time"><ng-content select="time, [time]" /></div>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    '[class.unread]': 'unread()',
    '[class.selected]': 'selected()',
  },
})
export class ShipLayoutInboxItem {
  /** Not read yet: bold sender and subject plus an accent bar. */
  unread = input(false, { transform: booleanAttribute });
  /** Open in the reader or checked. */
  selected = input(false, { transform: booleanAttribute });
}
