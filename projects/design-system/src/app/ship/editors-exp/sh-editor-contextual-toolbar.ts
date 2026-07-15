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

/** Consumer-provided extra contextual actions, keyed by block type. */
export type ContextualActionExtras = Record<string, (ctx: ContextualActionCtx) => ContextualAction[]>;

/**
 * Generic contextual toolbar. Shows over the currently-selected block (a void
 * block such as an image today) and renders the actions that block's behavior
 * declares via `contextualActions()`, followed by any consumer extras for that
 * block type (`extras` input). Nothing here is image-specific — a custom block
 * behavior that implements `contextualActions()` gets a toolbar for free, and
 * consumers can append buttons to any block's menu without subclassing.
 *
 * Positioning reuses `sh-popover`: an anchor element is placed over the selected
 * block and the popover positions the toolbar around it (flip / viewport-clamp).
 * `closeOnOverlay: false` keeps it non-modal, so the editor stays interactive
 * while the toolbar is up (the selection — not an outside click — closes it).
 */
@Component({
  selector: 'sh-editor-contextual-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon, ShipTooltip, ShipPopover],
  template: `
    <div
      class="sh-editor-block-anchor"
      [style.top.px]="rect().top"
      [style.left.px]="rect().left"
      [style.width.px]="rect().width"
      [style.height.px]="rect().height">
      <sh-popover [isOpen]="actions().length > 0" [disableOpenByClick]="true" [options]="{ closeOnButton: false, closeOnEsc: false, closeOnOverlay: false }">
        <div trigger class="sh-editor-block-anchor-trigger"></div>
        <div class="sh-editor-contextual-toolbar" (mousedown)="$event.preventDefault()">
          @for (action of actions(); track action.id) {
            <button
              [class.active]="action.isActive"
              [class.danger]="action.danger"
              [shTooltip]="action.label"
              (click)="action.run()">
              @if (action.icon) {
                <sh-icon>{{ action.icon }}</sh-icon>
              } @else {
                {{ action.label }}
              }
            </button>
          }
        </div>
      </sh-popover>
    </div>
  `,
})
export class ShipEditorContextualToolbar {
  /** The editor's contenteditable surface (source of the selected block's box). */
  surface = input.required<HTMLElement>();
  /** Consumer-provided extra actions, keyed by block type. */
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

  /** Anchor box over the selected block, in `.sh-editor-container` coordinates. */
  rect = signal({ top: 0, left: 0, width: 0, height: 0 });

  constructor() {
    // Reposition the anchor over the selected block when the selection changes
    // or an edit resizes it.
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
