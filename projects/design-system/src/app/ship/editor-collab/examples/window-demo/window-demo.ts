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
import { ShipEditor } from '@ship-ui/core/ship-editor';
import { ShEditorCollabDirective } from '@ship-ui/core/ship-editor-collab';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Fuzzer, hash } from '../fuzz-demo/fuzzer';

/**
 * One editor per window. Open a second window, fuzz one, type in the other,
 * compare checksums.
 */
@Component({
  selector: 'window-demo-example',
  imports: [ShipEditor, ShEditorCollabDirective, ShipButton, ShipChip, ShipToggle],
  templateUrl: './window-demo.html',
  styleUrl: './window-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowDemo implements OnDestroy {
  editor = viewChild(ShipEditor);
  collab = viewChild(ShEditorCollabDirective);
  me = {
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
  fuzzer = new Fuzzer();

  initialHtml = `<h2>Across windows</h2><p>Every window of this page shares this document.</p>`;

  peers = computed(() => Array.from(this.collab()?.collab.peers().values() ?? []));
  tick = signal(0);
  checksum = computed(() => {
    this.tick();
    const engine = this.editor()?.engine;
    return engine ? hash(JSON.stringify(engine.document())) : '—';
  });
  #timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    afterNextRender(() => {
      this.#timer = setInterval(() => this.tick.update((n) => n + 1), 300);
    });
  }

  openWindow() {
    window.open(location.href, '_blank', 'width=760,height=920');
  }

  toggle(on: boolean) {
    this.fuzzer.toggle(on, () => this.editor()?.engine);
  }

  ngOnDestroy() {
    this.toggle(false);
    if (this.#timer) clearInterval(this.#timer);
  }
}

const NAMES = ['Ada', 'Grace', 'Alan', 'Edsger', 'Barbara', 'Donald'];
const COLORS = ['#e0533d', '#2f6fed', '#0f9d58', '#ab47bc', '#f4a712', '#00897b'];
