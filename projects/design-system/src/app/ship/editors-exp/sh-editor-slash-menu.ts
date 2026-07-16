import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { SlashCommand } from './editor-behaviors';
import { EditorEngineService } from './editor-engine.service';

/**
 * Generic slash-command menu. Opens when the engine reports a `/query` trigger
 * (a `/` at a block edge, typed into an editable text block) and lists the
 * commands every registered block behavior declares via `slashCommands()`,
 * followed by any consumer extras (`commands` input) — nothing here is tied to a
 * specific block type, so a new behavior becomes slash-insertable for free, the
 * same way the contextual toolbar renders `contextualActions()`.
 *
 * The editor owns the keyboard (focus stays in the contenteditable), so it
 * drives navigation by calling `move()`/`confirm()`/`close()`; this component
 * only renders and applies. Selecting a command routes through
 * `engine.applySlashCommand`, which strips the `/query` text first.
 */
@Component({
  selector: 'sh-editor-slash-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  template: `
    @if (isOpen()) {
      <div class="sh-editor-slash-menu" [style.top.px]="top()" [style.left.px]="left()" (mousedown)="$event.preventDefault()">
        @for (group of view(); track group.name) {
          @if (group.name) {
            <div class="slash-header">{{ group.name }}</div>
          }
          @for (item of group.items; track item.cmd.id) {
            <button
              type="button"
              [class.active]="item.index === highlighted()"
              (mousemove)="highlighted.set(item.index)"
              (click)="runAt(item.index)">
              @if (item.cmd.icon) {
                <sh-icon>{{ item.cmd.icon }}</sh-icon>
              }
              <span>{{ item.cmd.label }}</span>
            </button>
          }
        }
        @if (!filtered().length) {
          <div class="slash-empty">No matches</div>
        }
      </div>
    }
  `,
})
export class ShipEditorSlashMenu {
  /** Consumer-provided extra commands, appended after the behavior-declared set. */
  commands = input<SlashCommand[]>([]);

  engine = inject(EditorEngineService);
  #selfRef = inject(ElementRef<HTMLElement>);

  /** Index (into `filtered()`) of the highlighted row. */
  highlighted = signal(0);
  top = signal(0);
  left = signal(0);

  /** A query the user dismissed with Escape; the menu stays closed until the
   * query changes (they keep typing) so Escape actually hides it. */
  #dismissedQuery = signal<string | null>(null);

  /** Commands matching the current query (label or keyword substring). */
  readonly filtered = computed<SlashCommand[]>(() => {
    const state = this.engine.slashState();
    if (!state) return [];
    const all = [...this.engine.slashCommands(), ...this.commands()];
    const q = state.query.toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) => c.label.toLowerCase().includes(q) || (c.keywords ?? []).some((k) => k.toLowerCase().includes(q))
    );
  });

  readonly isOpen = computed(() => {
    const state = this.engine.slashState();
    return state !== null && state.query !== this.#dismissedQuery() && this.filtered().length > 0;
  });

  /** `filtered()` bucketed by `group`, each item carrying its flat index so
   * keyboard navigation stays a single 0..n-1 range across groups. */
  readonly view = computed(() => {
    const groups: { name: string; items: { cmd: SlashCommand; index: number }[] }[] = [];
    this.filtered().forEach((cmd, index) => {
      const name = cmd.group ?? '';
      let group = groups.find((g) => g.name === name);
      if (!group) groups.push((group = { name, items: [] }));
      group.items.push({ cmd, index });
    });
    return groups;
  });

  constructor() {
    // Reset the highlight to the top whenever the match set changes (new query).
    effect(() => {
      this.filtered();
      this.highlighted.set(0);
    });
    // Re-anchor under the caret while open.
    effect(() => {
      if (!this.isOpen()) return;
      this.engine.slashState();
      queueMicrotask(() => this.#reposition());
    });
  }

  /** Move the highlight by `delta`, wrapping. Called by the editor's keydown. */
  move(delta: number) {
    const n = this.filtered().length;
    if (n) this.highlighted.set((this.highlighted() + delta + n) % n);
  }

  /** Apply the highlighted command. Called by the editor on Enter/Tab. */
  confirm() {
    this.runAt(this.highlighted());
  }

  runAt(index: number) {
    const cmd = this.filtered()[index];
    if (cmd) this.engine.applySlashCommand(cmd);
  }

  /** Hide the menu for the current query (Escape) without altering the text. */
  close() {
    this.#dismissedQuery.set(this.engine.slashState()?.query ?? null);
  }

  #reposition() {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.top === 0 && rect.left === 0) return; // no layout box (e.g. empty block edge)
    this.top.set(rect.bottom + 4);
    this.left.set(rect.left);
  }
}
