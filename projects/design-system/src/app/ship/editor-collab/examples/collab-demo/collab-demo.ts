import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipEditor, logicalToPos } from '@ship-ui/core/ship-editor';
import { ShEditorCollabDirective } from '@ship-ui/core/ship-editor-collab';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

const PEER_COLORS = ['#e0533d', '#2f6fed', '#0f9d58', '#ab47bc', '#f4a712', '#00897b'];
const PEER_NAMES = ['Ada', 'Grace', 'Alan', 'Edsger', 'Barbara', 'Donald'];

/**
 * `shCollab` on the editor is the integration. The rest is demo chrome:
 * peer chips, a checksum to compare windows, and a fuzz mode at the bottom.
 */
@Component({
  selector: 'collab-demo-example',
  imports: [ShipEditor, ShEditorCollabDirective, ShipButton, ShipChip, ShipToggle],
  templateUrl: './collab-demo.html',
  styleUrl: './collab-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollabDemo implements OnDestroy {
  editor = viewChild<ShipEditor>('collabEditor');
  collab = viewChild<ShEditorCollabDirective>(ShEditorCollabDirective);

  me = {
    name: PEER_NAMES[Math.floor(Math.random() * PEER_NAMES.length)],
    color: PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)],
  };

  initialHtml = `<h2>Collaborative editing</h2><p>This document is shared between every window of this page — edits, carets and undo all stay in sync through the <strong>op-rebase</strong> pipeline.</p><p>Open a second window and type in both.</p>`;

  // ── Demo chrome ──────────────────────────────────────────────────────────

  peerList = computed(() => Array.from(this.collab()?.collab.peers().values() ?? []));

  version = signal(0);
  checksum = computed(() => {
    this.version();
    const engine = this.editor()?.engine;
    return engine ? hash(JSON.stringify(engine.document())) : '—';
  });
  #badgeTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    afterNextRender(() => {
      const engine = this.editor()?.engine;
      if (!engine) return;
      this.#badgeTimer = setInterval(() => this.version.set(engine.version()), 300);
    });
  }

  openWindow() {
    window.open(location.href, '_blank', 'width=760,height=920');
  }

  ngOnDestroy() {
    if (this.#badgeTimer) clearInterval(this.#badgeTimer);
    this.toggleFuzz(false);
  }

  // ── Fuzz mode — not part of the integration. Delete below in your app. ───

  fuzzing = signal(false);
  fuzzOps = signal(0);
  #fuzzTimer: ReturnType<typeof setInterval> | null = null;
  #fuzzStop: ReturnType<typeof setTimeout> | null = null;

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
}

const FUZZ_WORDS = ['ship', 'collab', 'rebase', 'signal', 'editor', 'op'];

/** Tiny stable checksum so two windows can visually compare documents. */
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(7, '0');
}
