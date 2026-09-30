import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { ShipAvatar, ShipAvatarGroup } from '@ship-ui/core/ship-avatar';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChat } from '@ship-ui/core/ship-chat';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipDivider } from '@ship-ui/core/ship-divider';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';

type Sender = 'ada' | 'grace' | 'me';

interface Message {
  id: number;
  from: Sender;
  time: string;
  text: string;
  reactions?: string[];
}

const REPLIES = ['Nice, looks good from here.', 'Ship it 🚀', 'Let me double-check the numbers.'];

@Component({
  selector: 'app-chat-interface-example',
  imports: [ShipCard, ShipChat, ShipAvatar, ShipAvatarGroup, ShipButton, ShipIcon, ShipChip, ShipDivider, ShipFormField],
  templateUrl: './chat-interface.html',
  styleUrl: './chat-interface.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInterface {
  people: Record<string, string> = { ada: 'Ada Lovelace', grace: 'Grace Hopper' };

  messages = signal<Message[]>([
    { id: 1, from: 'ada', time: '09:12', text: 'Morning! Is the release still on for today?' },
    { id: 2, from: 'ada', time: '09:12', text: 'Marketing wants to know by noon.' },
    { id: 3, from: 'grace', time: '09:20', text: 'QA signed off last night.', reactions: ['🎉 2'] },
    { id: 4, from: 'me', time: '09:31', text: 'Yes — tagging the build now.' },
    { id: 5, from: 'me', time: '09:31', text: 'Changelog is in the release PR if anyone wants a last look.' },
  ]);
  draft = signal('');
  typing = signal(false);

  // A message continues the previous one when it's from the same sender.
  thread = computed(() =>
    this.messages().map((m, i, all) => ({ ...m, continued: i > 0 && all[i - 1].from === m.from }))
  );

  private scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  constructor() {
    afterRenderEffect(() => {
      this.thread();
      this.typing();
      const el = this.scroller().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  send(event: Event) {
    if (event instanceof KeyboardEvent && event.shiftKey) return;
    event.preventDefault();

    const text = this.draft().trim();
    if (!text) return;

    this.#push('me', text);
    this.draft.set('');

    this.typing.set(true);
    setTimeout(() => {
      this.typing.set(false);
      this.#push('ada', REPLIES[Math.floor(Math.random() * REPLIES.length)]);
    }, 1500);
  }

  #push(from: Sender, text: string) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.update((list) => [...list, { id: list.length + 1, from, time, text }]);
  }
}
