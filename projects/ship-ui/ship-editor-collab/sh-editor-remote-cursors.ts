import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { ASTDocument, EditorEngineService, nodeSize } from '@ship-ui/core/ship-editor';
import { ShipEditorCollab } from './ship-editor-collab';

interface PeerPaint {
  clientId: string;
  name: string;
  color: string;
  caret: { left: number; top: number; height: number } | null;
  rects: { left: number; top: number; width: number; height: number }[];
}

/**
 * Paints the carets and selections of remote peers over an `sh-editor`.
 *
 * Place it as a sibling of the editor inside a `position: relative`
 * container; it locates the editor surface itself and repaints on document
 * and presence changes. Peer selections are flat positions — resolved to
 * pixel rects through the live DOM, so they track marks, wraps and images.
 */
@Component({
  selector: 'sh-editor-remote-cursors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @for (peer of paints(); track peer.clientId) {
      @for (rect of peer.rects; track $index) {
        <div
          class="remote-selection"
          [style.left.px]="rect.left"
          [style.top.px]="rect.top"
          [style.width.px]="rect.width"
          [style.height.px]="rect.height"
          [style.background]="peer.color"></div>
      }
      @if (peer.caret) {
        <div
          class="remote-caret"
          [style.left.px]="peer.caret.left"
          [style.top.px]="peer.caret.top"
          [style.height.px]="peer.caret.height"
          [style.background]="peer.color">
          <span class="remote-label" [style.background]="peer.color">{{ peer.name }}</span>
        </div>
      }
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .remote-selection {
      position: absolute;
      opacity: 0.22;
      border-radius: 2px;
    }

    .remote-caret {
      position: absolute;
      width: 2px;

      .remote-label {
        position: absolute;
        bottom: 100%;
        left: -2px;
        padding: 1px 6px;
        border-radius: 4px 4px 4px 0;
        font-size: 11px;
        line-height: 1.5;
        color: #fff;
        white-space: nowrap;
      }
    }
  `,
})
export class ShEditorRemoteCursors {
  #selfRef = inject(ElementRef<HTMLElement>);
  #injector = inject(Injector);

  /** The engine of the editor being collaborated on. */
  engine = input.required<EditorEngineService>();
  /** The collab session whose peers should be painted. */
  collab = input.required<ShipEditorCollab>();

  paints = signal<PeerPaint[]>([]);

  #version = computed(() => this.engine().version());

  constructor() {
    afterNextRender(() => {
      effect(
        () => {
          this.collab().peers();
          this.#version();
          queueMicrotask(() => this.#repaint());
        },
        { injector: this.#injector },
      );
      const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.#repaint()) : null;
      const surface = this.#surface();
      if (observer && surface) observer.observe(surface);
    });
  }

  #surface(): HTMLElement | null {
    const host = this.#selfRef.nativeElement as HTMLElement;
    return (
      host.parentElement?.querySelector('.sh-editor-content') ??
      host.closest('sh-editor')?.querySelector('.sh-editor-content') ??
      null
    );
  }

  #repaint(): void {
    const surface = this.#surface();
    if (!surface) return;
    const hostRect = (this.#selfRef.nativeElement as HTMLElement).getBoundingClientRect();
    const doc = this.engine().document();
    const paints: PeerPaint[] = [];

    for (const peer of this.collab().peers().values()) {
      if (!peer.selection) continue;
      const from = this.#domPoint(surface, doc, Math.min(peer.selection.from, peer.selection.to));
      const to = this.#domPoint(surface, doc, Math.max(peer.selection.from, peer.selection.to));
      if (!to) continue;

      const rects: PeerPaint['rects'] = [];
      if (from && (peer.selection.from !== peer.selection.to)) {
        const range = document.createRange();
        range.setStart(from.node, from.offset);
        range.setEnd(to.node, to.offset);
        for (const rect of Array.from(range.getClientRects())) {
          rects.push({
            left: rect.left - hostRect.left,
            top: rect.top - hostRect.top,
            width: rect.width,
            height: rect.height,
          });
        }
      }

      const caretRange = document.createRange();
      caretRange.setStart(to.node, to.offset);
      caretRange.collapse(true);
      const caretRect = caretRange.getClientRects()[0] ?? (to.node as Element).getBoundingClientRect?.();
      paints.push({
        clientId: peer.clientId,
        name: peer.name,
        color: peer.color,
        caret: caretRect
          ? { left: caretRect.left - hostRect.left, top: caretRect.top - hostRect.top, height: caretRect.height || 18 }
          : null,
        rects,
      });
    }
    this.paints.set(paints);
  }

  /**
   * Resolve a flat document position to a DOM text node + offset: find the
   * block by walking flat sizes, then the text node by walking the block's
   * rendered text content.
   */
  #domPoint(surface: HTMLElement, doc: ASTDocument, pos: number): { node: Node; offset: number } | null {
    let at = 0;
    for (let blockIndex = 0; blockIndex < doc.length; blockIndex++) {
      const size = nodeSize(doc[blockIndex]);
      if (pos < at + size) {
        const blockEl = surface.children[blockIndex];
        if (!blockEl) return null;
        const offsetInBlock = Math.max(0, pos - at - 1);
        const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
        let remaining = offsetInBlock;
        let last: Text | null = null;
        for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
          last = node;
          const length = node.textContent?.length ?? 0;
          if (remaining <= length) return { node, offset: remaining };
          remaining -= length;
        }
        return last ? { node: last, offset: last.textContent?.length ?? 0 } : { node: blockEl, offset: 0 };
      }
      at += size;
    }
    return null;
  }
}
