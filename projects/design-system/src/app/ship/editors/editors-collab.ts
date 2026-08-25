import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipEditor, logicalToPos } from '@ship-ui/core/ship-editor';
import {
  BroadcastChannelTransport,
  ShEditorRemoteCursors,
  ShipEditorCollab,
} from '@ship-ui/core/ship-editor-collab';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Highlight } from '../../previewer/highlight/highlight';
import { HighlightFile } from '../../previewer/highlight-file/highlight-file';
import { Previewer } from '../../previewer/previewer';
import { MinimalCollab } from './examples/minimal-collab/minimal-collab';

const PEER_COLORS = ['#e0533d', '#2f6fed', '#0f9d58', '#ab47bc', '#f4a712', '#00897b'];
const PEER_NAMES = ['Ada', 'Grace', 'Alan', 'Edsger', 'Barbara', 'Donald'];
const FUZZ_WORDS = ['ship', 'collab', 'rebase', 'signal', 'editor', 'op'];

/** Tiny stable checksum so two windows can visually compare documents. */
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(7, '0');
}

@Component({
  selector: 'app-editors-collab',
  imports: [Previewer, Highlight, HighlightFile, ShipEditor, ShEditorRemoteCursors, ShipButton, ShipToggle, MinimalCollab],
  providers: [ShipEditorCollab],
  templateUrl: './editors-collab.html',
  styleUrl: './editors-collab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorsCollab implements OnDestroy {
  collab = inject(ShipEditorCollab);
  editor = viewChild<ShipEditor>('collabEditor');

  transport = new BroadcastChannelTransport('ship-docs-collab');
  me = {
    name: PEER_NAMES[Math.floor(Math.random() * PEER_NAMES.length)],
    color: PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)],
  };

  fuzzing = signal(false);
  fuzzOps = signal(0);
  #fuzzTimer: ReturnType<typeof setInterval> | null = null;
  #fuzzStop: ReturnType<typeof setTimeout> | null = null;

  version = signal(0);
  checksum = computed(() => {
    this.version();
    const engine = this.editor()?.engine;
    return engine ? hash(JSON.stringify(engine.document())) : '—';
  });
  peerList = computed(() => Array.from(this.collab.peers().values()));

  WS_TRANSPORT = `// editor.engine comes from the ShipEditor component instance —
// grab it with a viewChild on the <sh-editor #editor /> in your template.
@Component({ providers: [ShipEditorCollab], /* … */ })
export class DocPage {
  collab = inject(ShipEditorCollab);
  editor = viewChild.required<ShipEditor>('editor');

  constructor() {
    afterNextRender(() => {
      // One line to go cross-machine — point it at a relay that fans
      // messages out in arrival order (total order = convergence).
      const transport = new WebSocketTransport('ws://localhost:8787/my-doc');

      this.collab.attach(this.editor().engine, {
        transport,
        presence: { name: 'Ada', color: '#e0533d' },
      });
    });
  }
}`;

  RELAY_CMD = `bun scripts/collab-relay.ts   # reference relay, ~40 lines`;

  CUSTOM_TRANSPORT = `interface CollabTransport {
  send(message: CollabMessage): void;
  subscribe(cb: (m: CollabMessage) => void): () => void;
  readonly connected: Signal<boolean>;
  destroy?(): void;
}`;

  initialHtml = `<h2>Collaborative editing</h2><p>This document is shared between every window of this page — edits, carets and undo all stay in sync through the <strong>op-rebase</strong> pipeline.</p><p>Open a second window and type in both.</p>`;

  constructor() {
    afterNextRender(() => {
      const editor = this.editor();
      if (!editor) return;
      this.collab.attach(editor.engine, {
        transport: this.transport,
        presence: this.me,
      });
      // Mirror engine version into a page signal for the checksum badge.
      const engine = editor.engine;
      const tick = () => this.version.set(engine.version());
      const interval = setInterval(tick, 300);
      this.#badgeTimer = interval;
    });
  }

  #badgeTimer: ReturnType<typeof setInterval> | null = null;

  openWindow() {
    window.open(location.href, '_blank', 'width=760,height=920');
  }

  toggleFuzz(on: boolean) {
    this.fuzzing.set(on);
    if (this.#fuzzTimer) clearInterval(this.#fuzzTimer);
    if (this.#fuzzStop) clearTimeout(this.#fuzzStop);
    this.#fuzzTimer = null;
    this.#fuzzStop = null;
    if (!on) return;

    this.fuzzOps.set(0);
    this.#fuzzTimer = setInterval(() => this.#fuzzStep(), 250);
    // Safety valve: stop after 60 s.
    this.#fuzzStop = setTimeout(() => this.toggleFuzz(false), 60_000);
  }

  #fuzzStep() {
    const engine = this.editor()?.engine;
    if (!engine) return;
    const doc = engine.document();
    if (JSON.stringify(doc).length > 20_000) {
      this.toggleFuzz(false);
      return;
    }

    const blockIndex = Math.floor(Math.random() * doc.length);
    const text = (doc[blockIndex].content as { text?: string }[]).map((n) => n.text ?? '').join('');
    const offset = Math.floor(Math.random() * (text.length + 1));
    const at = logicalToPos(doc, { blockIndex, inlineIndex: 0, offset });

    if (Math.random() < 0.75 || text.length < 8) {
      engine.selection.live.set({ from: at, to: at });
      engine.insertText(` ${FUZZ_WORDS[Math.floor(Math.random() * FUZZ_WORDS.length)]}`);
    } else {
      const len = 1 + Math.floor(Math.random() * Math.min(5, text.length - offset));
      engine.selection.live.set({ from: at, to: Math.min(at + len, at + (text.length - offset)) });
      engine.deleteRange();
    }
    this.fuzzOps.update((n) => n + 1);
  }

  ngOnDestroy() {
    this.toggleFuzz(false);
    if (this.#badgeTimer) clearInterval(this.#badgeTimer);
    this.collab.detach();
    this.transport.destroy();
  }
}
