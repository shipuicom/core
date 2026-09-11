import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  signal,
  viewChildren,
} from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipEditor } from '@ship-ui/core/ship-editor';
import { ShEditorCollabDirective } from '@ship-ui/core/ship-editor-collab';

/**
 * Two editors, one channel. `shCollab` on each editor is the integration;
 * the BroadcastChannel name reaches the other editor here and any other
 * window of this page. The chips are demo chrome.
 */
@Component({
  selector: 'collab-demo-example',
  imports: [ShipEditor, ShEditorCollabDirective, ShipChip],
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

  initialHtml = `<h2>Collaborative editing</h2><p>Both editors share one document — edits, carets and undo stay in sync.</p><p>Type in either one.</p>`;

  // ── Demo chrome ──────────────────────────────────────────────────────────

  peers = computed(() => this.collabs().map((c) => Array.from(c.collab.peers().values())));

  tick = signal(0);
  checksums = computed(() => {
    this.tick();
    return this.editors().map((editor) => hash(JSON.stringify(editor.engine.document())));
  });
  #timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    afterNextRender(() => {
      this.#timer = setInterval(() => this.tick.update((n) => n + 1), 300);
    });
  }

  ngOnDestroy() {
    if (this.#timer) clearInterval(this.#timer);
  }
}

/** Tiny stable checksum so two editors can visually compare documents. */
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(7, '0');
}
