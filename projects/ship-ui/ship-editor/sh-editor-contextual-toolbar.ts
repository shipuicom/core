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
import { ShipPopover } from '@ship-ui/core/ship-popover';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';
import { ContextualAction, ContextualActionCtx } from './editor-behaviors';
import { EditorEngineService } from './editor-engine.service';

export type ContextualActionExtras = Record<string, (ctx: ContextualActionCtx) => ContextualAction[]>;

@Component({
  selector: 'sh-editor-contextual-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon, ShipTooltip, ShipPopover],
  templateUrl: './sh-editor-contextual-toolbar.html',
})
export class ShipEditorContextualToolbar {

  surface = input.required<HTMLElement>();

  extras = input<ContextualActionExtras>({});

  engine = inject(EditorEngineService);
  #selfRef = inject(ElementRef<HTMLElement>);

  actions = computed<ContextualAction[]>(() => {
    const index = this.engine.selectedBlock();
    const block = this.engine.selectedBlockNode();
    if (index === null || !block) return [];
    const ctx: ContextualActionCtx = { block, index, engine: this.engine };
    const base = this.engine.blocks.get(block.type)?.contextualActions?.(ctx) ?? [];
    const extra = this.extras()[block.type]?.(ctx) ?? [];
    return [...base, ...extra];
  });

  rect = signal({ top: 0, left: 0, width: 0, height: 0 });

  constructor() {

    effect(() => {
      const idx = this.engine.selectedBlock();
      this.engine.version();
      if (idx === null) return;
      queueMicrotask(() => this.#positionAnchor(idx));
    });
  }

  #positionAnchor(idx: number) {
    const container = this.#selfRef.nativeElement.closest('.sh-editor-container') as HTMLElement | null;
    const blockEl = this.surface().children[idx] as HTMLElement | undefined;
    if (!container || !blockEl) return;
    const c = container.getBoundingClientRect();
    const r = blockEl.getBoundingClientRect();
    this.rect.set({ top: r.top - c.top, left: r.left - c.left, width: r.width, height: r.height });
  }
}
