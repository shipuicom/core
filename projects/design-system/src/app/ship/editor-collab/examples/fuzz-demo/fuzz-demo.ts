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
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Fuzzer, hash } from './fuzzer';

/**
 * Convergence under load. Each side can be stormed with random edits while
 * you type in the other; matching checksums mean both documents converged.
 * Nothing here is needed for collaboration — `shCollab` is.
 */
@Component({
  selector: 'fuzz-demo-example',
  imports: [ShipEditor, ShEditorCollabDirective, ShipChip, ShipToggle],
  templateUrl: './fuzz-demo.html',
  styleUrl: './fuzz-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FuzzDemo implements OnDestroy {
  sides = [
    { name: 'Ada', color: '#e0533d', fuzzer: new Fuzzer() },
    { name: 'Grace', color: '#2f6fed', fuzzer: new Fuzzer() },
  ];
  editors = viewChildren(ShipEditor);

  initialHtml = `<h2>Convergence</h2><p>Fuzz one side and type in the other.</p>`;

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

  toggle(i: number, on: boolean) {
    this.sides[i].fuzzer.toggle(on, () => this.editors()[i]?.engine);
  }

  ngOnDestroy() {
    this.sides.forEach((_, i) => this.toggle(i, false));
    if (this.#timer) clearInterval(this.#timer);
  }
}
