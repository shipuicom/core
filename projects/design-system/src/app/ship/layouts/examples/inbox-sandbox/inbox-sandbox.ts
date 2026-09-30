import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ShipColor, ShipLayoutInboxVariant } from '@ship-ui/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutInbox, ShipLayoutInboxItem, ShipLayoutToolbar } from '@ship-ui/core/ship-layout';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';

interface Mail {
  id: number;
  from: string;
  subject: string;
  snippet: string;
  time: string;
  unread: boolean;
  starred: boolean;
  label?: string;
  labelColor?: ShipColor;
}

@Component({
  selector: 'app-inbox-sandbox',
  imports: [
    ShipLayoutInbox,
    ShipLayoutInboxItem,
    ShipLayoutToolbar,
    ShipAvatar,
    ShipButton,
    ShipCheckbox,
    ShipChip,
    ShipIcon,
    ShipTooltip,
  ],
  templateUrl: './inbox-sandbox.html',
  styleUrl: './inbox-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InboxSandbox {
  variant = input<ShipLayoutInboxVariant>('');
  readingPane = input(true);

  openId = signal<number | null>(1);
  openMail = computed(() => this.mails.find((mail) => mail.id === this.openId()) ?? null);
  unreadCount = computed(() => this.mails.filter((mail) => mail.unread).length);

  mails: Mail[] = [
    {
      id: 1,
      from: 'Sofia Lund',
      subject: 'Design review moved to Thursday',
      snippet: 'Hey! The design review got pushed to Thursday 14:00, the new header mocks are in Figma.',
      time: '10:42',
      unread: true,
      starred: true,
      label: 'Work',
      labelColor: 'primary',
    },
    {
      id: 2,
      from: 'GitHub',
      subject: '[ship-ui] PR #412 was merged',
      snippet: 'feat(ship-layout): stat ring and ranking components merged into main by sp90.',
      time: '09:15',
      unread: true,
      starred: false,
    },
    {
      id: 3,
      from: 'Mads Holm',
      subject: 'Pricing page copy',
      snippet: 'Attached the final copy for the pricing page, marketing signed off this morning.',
      time: 'Yesterday',
      unread: false,
      starred: true,
      label: 'Marketing',
      labelColor: 'accent',
    },
    {
      id: 4,
      from: 'Vercel',
      subject: 'Deployment ready',
      snippet: 'Your deployment of ship-docs is live at docs.shipui.com. Build took 48s.',
      time: 'Yesterday',
      unread: false,
      starred: false,
    },
    {
      id: 5,
      from: 'Freja Berg',
      subject: 'Lunch on Friday?',
      snippet: 'Thinking the new ramen place around the corner, 12:30 works for everyone?',
      time: 'Sep 26',
      unread: false,
      starred: false,
      label: 'Personal',
      labelColor: 'success',
    },
    {
      id: 6,
      from: 'Stripe',
      subject: 'Your September invoice',
      snippet: 'Your invoice for September is available. Amount due: $49.00.',
      time: 'Sep 25',
      unread: false,
      starred: false,
    },
    {
      id: 7,
      from: 'Jonas Krog',
      subject: 'Re: Accessibility audit',
      snippet: 'Found three focus-order issues on the settings page, notes are in the ticket.',
      time: 'Sep 24',
      unread: false,
      starred: false,
      label: 'Work',
      labelColor: 'primary',
    },
  ];
}
