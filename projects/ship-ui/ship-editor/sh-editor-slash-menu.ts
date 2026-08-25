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

@Component({
  selector: 'sh-editor-slash-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  templateUrl: './sh-editor-slash-menu.html',
})
export class ShipEditorSlashMenu {

  commands = input<SlashCommand[]>([]);

  engine = inject(EditorEngineService);
  #selfRef = inject(ElementRef<HTMLElement>);

  highlighted = signal(0);
  top = signal(0);
  left = signal(0);

  #dismissedQuery = signal<string | null>(null);

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

  #highlightedCmd: SlashCommand | null = null;

  constructor() {
    // A re-filter (each keystroke narrows the list) keeps the highlight on
    // the same command when it survives, instead of snapping back to the
    // first entry — arrowing down and typing on must not race the filter.
    effect(() => {
      const list = this.filtered();
      const kept = this.#highlightedCmd ? list.indexOf(this.#highlightedCmd) : -1;
      if (kept >= 0) {
        this.highlighted.set(kept);
      } else {
        this.highlighted.set(0);
        this.#highlightedCmd = null;
      }
    });

    // A dismissal is scoped to one slash session: once the state clears (the
    // '/' deleted, a command run, the caret moved away), the next '/' with
    // the same query — especially the bare-'/' empty query — opens again.
    effect(() => {
      if (this.engine.slashState() === null) {
        this.#dismissedQuery.set(null);
        this.#highlightedCmd = null;
      }
    });

    effect(() => {
      if (!this.isOpen()) return;
      this.engine.slashState();
      queueMicrotask(() => this.#reposition());
    });
  }

  move(delta: number) {
    const n = this.filtered().length;
    if (!n) return;
    const next = (this.highlighted() + delta + n) % n;
    this.highlighted.set(next);
    this.#highlightedCmd = this.filtered()[next] ?? null;
  }

  confirm() {
    this.runAt(this.highlighted());
  }

  runAt(index: number) {
    const cmd = this.filtered()[index];
    if (cmd) this.engine.applySlashCommand(cmd);
  }

  close() {
    this.#dismissedQuery.set(this.engine.slashState()?.query ?? null);
  }

  #reposition() {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.top === 0 && rect.left === 0) return;
    this.top.set(rect.bottom + 4);
    this.left.set(rect.left);
  }
}
