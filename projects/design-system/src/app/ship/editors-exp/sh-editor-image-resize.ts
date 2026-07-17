import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, PLATFORM_ID, ViewEncapsulation, effect, inject, input, signal } from '@angular/core';
import { EditorEngineService } from './editor-engine.service';

type Corner = 'nw' | 'ne' | 'sw' | 'se';
type Edge = 'n' | 'e' | 's' | 'w';
type Handle = Corner | Edge;

/**
 * Drag-to-resize handles for a selected image. Renders a frame with a handle at
 * each corner, anchored over the image in `.sh-editor-container` coordinates
 * (the same positioning pattern as {@link ShipEditorContextualToolbar}).
 *
 * Dragging a corner sets only the image's WIDTH — because the projected `<img>`
 * is `height: auto`, the height follows and the aspect ratio is preserved, i.e.
 * the Google-Docs corner behaviour. The optional mid-edge handles (`edgeHandles`)
 * stretch a single axis: left/right change the width and freeze the height,
 * top/bottom change the height and freeze the width (non-aspect). The drag
 * previews live by writing the img's inline width/height directly (no transaction
 * per mouse move); the final size is committed once, on mouseup, via
 * `engine.updateSelectedImage` — a single undoable step. The `<img>` itself is a
 * bare child of the surface that `patchDOM` swaps wholesale on any attr change, so
 * the handles must live in this sibling overlay, never inside the image.
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
        @if (edgeHandles()) {
          @for (e of edges; track e) {
            <span class="sh-editor-resize-handle sh-editor-resize-edge sh-editor-resize-{{ e }}" (mousedown)="onHandleDown($event, e)"></span>
          }
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
  /** Opt in to the mid-edge handles, which stretch one axis (non-aspect). Off by
   * default — corner handles (aspect-preserving) are always available. */
  edgeHandles = input(false);

  engine = inject(EditorEngineService);
  #selfRef = inject(ElementRef<HTMLElement>);

  readonly corners: Corner[] = ['nw', 'ne', 'sw', 'se'];
  readonly edges: Edge[] = ['n', 'e', 's', 'w'];

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
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.#ro?.disconnect());
    // `window` isn't available under SSR/prerender; the ResizeObserver is already
    // gated by its own `typeof` guard above.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const onResize = () => this.#reanchor();
      window.addEventListener('resize', onResize);
      destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
    }
  }

  onHandleDown(event: MouseEvent, handle: Handle) {
    event.preventDefault(); // keep the image's node-selection; don't start a native drag
    event.stopPropagation();
    const idx = this.engine.selectedBlock();
    if (idx === null || this.readonly()) return;
    const img = this.surface().children[idx] as HTMLElement | undefined;
    if (!img || img.tagName !== 'IMG') return;

    const r0 = img.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = r0.width;
    const startH = r0.height;
    const isCorner = handle.length === 2;
    const vertical = handle === 'n' || handle === 's'; // edges that stretch height only
    const growsRight = handle.includes('e'); // e / ne / se
    const growsDown = handle === 's';

    // Upper bound for width: the surface's content width (so the handle can't
    // outrun the image once `max-width: 100%` clamps it). Height is unclamped.
    const surface = this.surface();
    const cs = getComputedStyle(surface);
    const maxWidth = surface.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
    const MIN = 40;

    const prevTransition = img.style.transition;
    img.style.transition = 'none'; // no easing lag during the live drag
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      if (vertical) {
        // Top/bottom edge: change height, freeze width → one-axis stretch.
        const dy = e.clientY - startY;
        const h = Math.max(MIN, startH + (growsDown ? dy : -dy));
        img.style.width = `${Math.round(startW)}px`;
        img.style.height = `${Math.round(h)}px`;
      } else {
        // Corner or left/right edge: change width. A corner keeps `height: auto`
        // (aspect-preserving); a left/right edge freezes the height (stretch).
        const dx = e.clientX - startX;
        const w = Math.max(MIN, Math.min(maxWidth, startW + (growsRight ? dx : -dx)));
        img.style.width = `${Math.round(w)}px`;
        img.style.height = isCorner ? 'auto' : `${Math.round(startH)}px`;
      }
      this.#position(idx); // keep the frame glued to the image as it resizes
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      img.style.transition = prevTransition;
      document.body.style.userSelect = '';
      // Persist as one undoable transaction; the re-render re-emits the size from
      // the AST. Corner → width only (`height: null` clears any prior stretch, so
      // `height: auto` restores aspect); edge → the stretched pair.
      const r = img.getBoundingClientRect();
      const attrs = vertical
        ? { width: Math.round(startW), height: Math.round(r.height) }
        : isCorner
          ? { width: Math.round(r.width), height: null }
          : { width: Math.round(r.width), height: Math.round(startH) };
      this.engine.updateSelectedImage(attrs);
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
