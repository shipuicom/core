import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewEncapsulation, effect, inject, input, signal } from '@angular/core';
import { EditorEngineService } from './editor-engine.service';

type Corner = 'nw' | 'ne' | 'sw' | 'se';

/**
 * Drag-to-resize handles for a selected image. Renders a frame with a handle at
 * each corner, anchored over the image in `.sh-editor-container` coordinates
 * (the same positioning pattern as {@link ShipEditorContextualToolbar}).
 *
 * Dragging any corner sets only the image's WIDTH — because the projected `<img>`
 * is `height: auto`, the height follows and the aspect ratio is preserved, i.e.
 * the Google-Docs corner behaviour. The drag previews live by writing the img's
 * inline `width` directly (no transaction per mouse move); the final width is
 * committed once, on mouseup, via `engine.updateSelectedImage` — a single
 * undoable step. The `<img>` itself is a bare child of the surface that
 * `patchDOM` swaps wholesale on any attr change, so the handles must live in this
 * sibling overlay, never inside the image.
 */
@Component({
  selector: 'sh-editor-image-resize',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (frame(); as f) {
      <div class="sh-editor-resize-frame" [style.top.px]="f.top" [style.left.px]="f.left" [style.width.px]="f.width" [style.height.px]="f.height">
        @for (c of corners; track c) {
          <span class="sh-editor-resize-handle sh-editor-resize-{{ c }}" (mousedown)="onHandleDown($event, c)"></span>
        }
      </div>
    }
  `,
})
export class ShipEditorImageResize {
  /** The editor's contenteditable surface (source of the selected block's box). */
  surface = input.required<HTMLElement>();
  /** Hide the handles when the editor is read-only. */
  readonly = input(false);

  engine = inject(EditorEngineService);
  #selfRef = inject(ElementRef<HTMLElement>);

  readonly corners: Corner[] = ['nw', 'ne', 'sw', 'se'];

  /** Handle frame over the selected image, in `.sh-editor-container` coordinates. */
  frame = signal<{ top: number; left: number; width: number; height: number } | null>(null);

  // Track the selected image's box: a remote image's size arrives asynchronously
  // (on load), and `max-width: 100%` recomputes it on reflow — neither of which
  // bumps the engine version, so re-anchor from the element itself.
  #observedImg: HTMLElement | null = null;
  #ro =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.#reanchor()) : null;

  constructor() {
    // Re-anchor when the selection changes or an edit resizes the image. Deferred
    // to a microtask so the projected DOM reflects the latest document() first.
    effect(() => {
      const idx = this.engine.selectedBlock();
      this.engine.version();
      this.readonly();
      if (idx === null) {
        this.frame.set(null);
        this.#unobserve();
        return;
      }
      queueMicrotask(() => this.#position(idx));
    });
    const onResize = () => this.#reanchor();
    window.addEventListener('resize', onResize);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', onResize);
      this.#ro?.disconnect();
    });
  }

  onHandleDown(event: MouseEvent, corner: Corner) {
    event.preventDefault(); // keep the image's node-selection; don't start a native drag
    event.stopPropagation();
    const idx = this.engine.selectedBlock();
    if (idx === null || this.readonly()) return;
    const img = this.surface().children[idx] as HTMLElement | undefined;
    if (!img || img.tagName !== 'IMG') return;

    const startX = event.clientX;
    const startWidth = img.getBoundingClientRect().width;
    const growsRight = corner === 'ne' || corner === 'se';

    // Upper bound: the surface's content width (so the handle can't outrun the
    // image once `max-width: 100%` clamps it). Lower bound keeps it grabbable.
    const surface = this.surface();
    const cs = getComputedStyle(surface);
    const maxWidth = surface.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
    const MIN_WIDTH = 40;

    const prevTransition = img.style.transition;
    img.style.transition = 'none'; // no easing lag during the live drag
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const raw = startWidth + (growsRight ? dx : -dx);
      const width = Math.max(MIN_WIDTH, Math.min(maxWidth, raw));
      img.style.width = `${Math.round(width)}px`;
      this.#position(idx); // keep the frame glued to the image as it resizes
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      img.style.transition = prevTransition;
      document.body.style.userSelect = '';
      // Persist as one undoable transaction; the re-render re-emits the width
      // from the AST (replacing this live-preview inline width with the same value).
      this.engine.updateSelectedImage({ width: Math.round(img.getBoundingClientRect().width) });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  #position(idx: number) {
    const el = this.surface().children[idx] as HTMLElement | undefined;
    if (this.readonly() || !el || el.tagName !== 'IMG') {
      this.frame.set(null);
      this.#unobserve();
      return;
    }
    if (this.#observedImg !== el) {
      this.#unobserve();
      this.#observedImg = el;
      this.#ro?.observe(el);
    }
    this.#reanchor();
  }

  /** Recompute the frame box from the currently-observed image. */
  #reanchor() {
    const el = this.#observedImg;
    const container = this.#selfRef.nativeElement.closest('.sh-editor-container') as HTMLElement | null;
    if (!el || !el.isConnected || !container) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    this.frame.set({ top: r.top - c.top, left: r.left - c.left, width: r.width, height: r.height });
  }

  #unobserve() {
    if (this.#observedImg) {
      this.#ro?.unobserve(this.#observedImg);
      this.#observedImg = null;
    }
  }
}
