import { booleanAttribute, ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipChatVariant, ShipColor } from '@ship-ui/core';

/**
 * A single chat message. Slot the parts in: `sh-avatar`, `b` (sender name),
 * `time`, the message content (text, `p`s, images, cards…), and `sh-chip`s or
 * an element marked `footer` (reactions, read receipts) below the bubble.
 * Stack messages in any block container — each one spaces itself from the
 * previous; mark follow-ups from the same sender `continued` and leave out
 * their avatar and name to group them.
 */
@Component({
  selector: 'sh-chat',
  styleUrl: './ship-chat.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="avatar"><ng-content select="sh-avatar, [avatar]" /></div>
    <div class="body">
      <div class="meta">
        <ng-content select="b, [name]" />
        <ng-content select="time" />
      </div>
      <div class="bubble">
        @if (typing()) {
          <span class="typing" role="status" aria-label="Typing"><i></i><i></i><i></i></span>
        } @else {
          <ng-content />
        }
      </div>
      <div class="footer"><ng-content select="sh-chip, [footer]" /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[class.outgoing]': 'outgoing()',
    '[class.continued]': 'continued()',
    '[class.typing]': 'typing()',
  },
})
export class ShipChat {
  /** Sent by the current user: aligned to the end with the outgoing bubble style. */
  outgoing = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  /** A follow-up from the same sender: sits tight under the previous message, keeping its avatar space. */
  continued = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  /** Replace the content with an animated typing indicator. */
  typing = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  /** Bubble color. Project default via `ShipConfig.chat.color`. */
  color = input<ShipColor | null>(null);
  /** Visual variant: `type-b` outlined bubbles, `type-c` flat rows (no bubbles, everything start-aligned). Project default via `ShipConfig.chat.variant`. */
  variant = input<ShipChatVariant | null>(null);

  hostClasses = shipComponentClasses('chat', { variant: this.variant, color: this.color });
}
