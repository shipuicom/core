import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, PLATFORM_ID, ViewEncapsulation, effect, inject, input, signal } from '@angular/core';
import { EditorEngineService } from './editor-engine.service';

type Corner = 'nw' | 'ne' | 'sw' | 'se';
type Edge = 'n' | 'e' | 's' | 'w';
type Handle = Corner | Edge;

@Component({
  selector: 'sh-editor-image-resize',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sh-editor-image-resize.html',
})
export class ShipEditorImageResize {

  surface = input.required<HTMLElement>();

  /** Maps an absolute block index to its mounted DOM element (window-aware). */
  blockElAt = input.required<(idx: number) => HTMLElement | undefined>();

  readonly = input(false);

  edgeHandles = input(false);

  engine = inject(EditorEngineService);
  #selfRef = inject(ElementRef<HTMLElement>);

  readonly corners: Corner[] = ['nw', 'ne', 'sw', 'se'];
  readonly edges: Edge[] = ['n', 'e', 's', 'w'];

  frame = signal<{ top: number; left: number; width: number; height: number } | null>(null);

  #observedImg: HTMLElement | null = null;
  #ro =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.#reanchor()) : null;

  constructor() {

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

    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const onResize = () => this.#reanchor();
      window.addEventListener('resize', onResize);
      destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
    }
  }

  onHandleDown(event: MouseEvent, handle: Handle) {
    event.preventDefault();
    event.stopPropagation();
    const idx = this.engine.selectedBlock();
    if (idx === null || this.readonly()) return;
    const img = this.blockElAt()(idx);
    if (!img || img.tagName !== 'IMG') return;

    const r0 = img.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = r0.width;
    const startH = r0.height;
    const isCorner = handle.length === 2;
    const vertical = handle === 'n' || handle === 's';
    const growsRight = handle.includes('e');
    const growsDown = handle === 's';

    const surface = this.surface();
    const cs = getComputedStyle(surface);
    const maxWidth = surface.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
    const MIN = 40;

    const prevTransition = img.style.transition;
    img.style.transition = 'none';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      if (vertical) {

        const dy = e.clientY - startY;
        const h = Math.max(MIN, startH + (growsDown ? dy : -dy));
        img.style.width = `${Math.round(startW)}px`;
        img.style.height = `${Math.round(h)}px`;
      } else {

        const dx = e.clientX - startX;
        const w = Math.max(MIN, Math.min(maxWidth, startW + (growsRight ? dx : -dx)));
        img.style.width = `${Math.round(w)}px`;
        img.style.height = isCorner ? 'auto' : `${Math.round(startH)}px`;
      }
      this.#position(idx);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      img.style.transition = prevTransition;
      document.body.style.userSelect = '';

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
    const el = this.blockElAt()(idx);

    if (this.readonly() || !el || el.tagName !== 'IMG' || el.classList.contains('sh-editor-img-theater')) {
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
