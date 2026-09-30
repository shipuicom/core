import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipChat } from '@ship-ui/core/ship-chat';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipDivider } from '@ship-ui/core/ship-divider';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';

interface Message {
  id: number;
  me: boolean;
  time: string;
  text: string;
}

interface Conversation {
  id: string;
  name: string;
  status: string;
  unread: number;
  messages: Message[];
}

const REPLIES = ['Sounds good!', 'On it 👍', 'Can we talk about it tomorrow?', 'Ha, fair enough.'];

@Component({
  selector: 'app-chat-page-example',
  imports: [ShipChat, ShipAvatar, ShipButton, ShipChip, ShipDivider, ShipFormField, ShipIcon, ShipList],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage {
  conversations = signal<Conversation[]>([
    {
      id: 'ada',
      name: 'Ada Lovelace',
      status: 'Active now',
      unread: 0,
      messages: [
        { id: 1, me: false, time: '09:12', text: 'Did you get a chance to look at the engine notes?' },
        { id: 2, me: false, time: '09:12', text: 'Note G is the interesting one.' },
        { id: 3, me: true, time: '09:30', text: 'Reading it now — the Bernoulli numbers part is wild.' },
      ],
    },
    {
      id: 'grace',
      name: 'Grace Hopper',
      status: 'Active 5m ago',
      unread: 2,
      messages: [
        { id: 1, me: true, time: '08:02', text: 'Is the compiler build green again?' },
        { id: 2, me: false, time: '08:40', text: 'Yes. Found a moth in relay 70.' },
        { id: 3, me: false, time: '08:41', text: 'It is taped into the logbook.' },
      ],
    },
    {
      id: 'alan',
      name: 'Alan Turing',
      status: 'Offline',
      unread: 1,
      messages: [{ id: 1, me: false, time: 'Yesterday', text: 'Can a machine think? Discuss over lunch.' }],
    },
    {
      id: 'linus',
      name: 'Linus Torvalds',
      status: 'Active 1h ago',
      unread: 0,
      messages: [{ id: 1, me: true, time: 'Mon', text: 'Thanks for merging the patch!' }],
    },
  ]);

  activeId = signal('ada');
  query = signal('');
  draft = signal('');
  typing = signal<string | null>(null);
  // Narrow screens show one pane at a time.
  threadOpen = signal(false);

  active = computed(() => this.conversations().find((c) => c.id === this.activeId())!);

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.conversations().filter((c) => !q || c.name.toLowerCase().includes(q));
  });

  // A message continues the previous one when it's from the same side.
  thread = computed(() =>
    this.active().messages.map((m, i, all) => ({ ...m, continued: i > 0 && all[i - 1].me === m.me }))
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

  lastMessage(conversation: Conversation) {
    const last = conversation.messages.at(-1);
    return last ? (last.me ? 'You: ' : '') + last.text : '';
  }

  open(id: string | null) {
    if (!id) return;
    this.activeId.set(id);
    this.threadOpen.set(true);
    this.#update(id, (c) => ({ ...c, unread: 0 }));
  }

  send(event: Event) {
    if (event instanceof KeyboardEvent && event.shiftKey) return;
    event.preventDefault();

    const text = this.draft().trim();
    if (!text) return;

    const id = this.activeId();
    this.#push(id, true, text);
    this.draft.set('');

    this.typing.set(id);
    setTimeout(() => {
      this.typing.set(null);
      this.#push(id, false, REPLIES[Math.floor(Math.random() * REPLIES.length)]);
      if (this.activeId() !== id) this.#update(id, (c) => ({ ...c, unread: c.unread + 1 }));
    }, 1500);
  }

  #push(id: string, me: boolean, text: string) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.#update(id, (c) => ({ ...c, messages: [...c.messages, { id: c.messages.length + 1, me, time, text }] }));
  }

  #update(id: string, fn: (c: Conversation) => Conversation) {
    this.conversations.update((list) => list.map((c) => (c.id === id ? fn(c) : c)));
  }
}
