import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  signal,
  viewChildren,
} from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipEditor, logicalToPos } from '@ship-ui/core/ship-editor';
import { ShEditorCollabDirective } from '@ship-ui/core/ship-editor-collab';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

/**
 * Two editors, one channel. `shCollab` on each editor is the integration;
 * a BroadcastChannel name reaches the other editor here and any other window
 * of this page. The rest is demo chrome: chips, a checksum per editor, and a
 * fuzz mode at the bottom.
 */
@Component({
  selector: 'collab-demo-example',
  imports: [ShipEditor, ShEditorCollabDirective, ShipButton, ShipChip, ShipToggle],
  templateUrl: './collab-demo.html',
  styleUrl: './collab-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollabDemo implements OnDestroy {
  sides = [
    { name: 'Ada', color: '#e0533d' },
    { name: 'Grace', color: '#2f6fed' },
  ];
  editors = viewChildren(ShipEditor);
  collabs = viewChildren(ShEditorCollabDirective);

  initialHtml = `<h2>Collaborative editing</h2><p>Both editors share one document — edits, carets and undo stay in sync through the <strong>op-rebase</strong> pipeline.</p><p>Type in either one.</p>`;

  // ── Demo chrome ──────────────────────────────────────────────────────────

  version = signal(0);
  checksums = computed(() => {
    this.version();
    return this.editors().map((editor) => hash(JSON.stringify(editor.engine.document())));
  });
  peers = computed(() => this.collabs().map((c) => Array.from(c.collab.peers().values())));
  #badgeTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    afterNextRender(() => {
      this.#badgeTimer = setInterval(() => this.version.update((n) => n + 1), 300);
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
  // Storms the left editor with random edits; the right one must converge.

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
    this.#fuzzStop = setTimeout(() => this.toggleFuzz(false), 60_000);
  }

  #fuzzStep() {
    const engine = this.editors()[0]?.engine;
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

/** Tiny stable checksum so two editors can visually compare documents. */
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(7, '0');
}
