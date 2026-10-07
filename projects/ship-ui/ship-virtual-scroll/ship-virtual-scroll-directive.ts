import { afterEveryRender, afterNextRender, computed, Directive, effect, ElementRef, inject, input, Renderer2, untracked } from '@angular/core';
import { ShipVirtualAxis, ShipVirtualWindow } from './virtual-window';

/**
 * Attribute-directive form of virtualization: apply it to the element that
 * holds your rows and render only the `start()..end()` slice yourself. The
 * directive owns the scroll math (via `ShipVirtualWindow`), the spacer
 * padding standing in for unmounted rows, and the measurement pass; the
 * host's element children are assumed to be exactly the rendered rows.
 *
 * Place the host inside a container with `overflow: auto` — the directive
 * scrolls against the nearest scrollable ancestor (falling back to the host
 * itself when the host is the scroll container):
 *
 * ```html
 * <div class="scroller">
 *   <div [shVirtualScroll]="items().length" #vs="shVirtualScroll">
 *     @for (item of items().slice(vs.start(), vs.end()); track item.id) {
 *       <div>{{ item.label }}</div>
 *     }
 *   </div>
 * </div>
 * ```
 *
 * With `virtualAxis="horizontal"` the container scrolls on x, items are
 * expected to be laid out in a row, and windowing is by width.
 */
@Directive({
  selector: '[shVirtualScroll]',
  exportAs: 'shVirtualScroll',
  host: {
    '[style.padding-top.px]': 'vertical() ? padStart() : null',
    '[style.padding-bottom.px]': 'vertical() ? padEnd() : null',
    '[style.padding-left.px]': 'vertical() ? null : padStart()',
    '[style.padding-right.px]': 'vertical() ? null : padEnd()',
    '[style.overflow-anchor]': '"none"',
  },
})
export class ShipVirtualScrollDirective {
  #host = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);

  /** Total number of items in the list. */
  shVirtualScroll = input.required<number>();
  /** Pixel size assumed for a row until it has been measured. */
  virtualEstimate = input(36);
  /** Pixels of content kept mounted beyond each viewport edge. */
  virtualOverscan = input(200);
  /** Scroll axis: `'vertical'` (default) windows by height, `'horizontal'` by width. */
  virtualAxis = input<ShipVirtualAxis>('vertical');

  readonly vertical = computed(() => this.virtualAxis() === 'vertical');

  /** The underlying engine, for advanced use (`splice` on edits, `heights.indexAt`, …). */
  readonly window = new ShipVirtualWindow({ count: 0 });

  /** First mounted index — slice your list from here. */
  readonly start = this.window.start;
  /** Exclusive end of the mounted range. */
  readonly end = this.window.end;
  readonly padStart = this.window.padStart;
  readonly padEnd = this.window.padEnd;
  readonly totalSize = this.window.totalSize;

  #scrollScheduled = false;
  #hostResizeObserver: ResizeObserver | null = null;
  #unlistenScroll: (() => void) | null = null;
  #scroller: HTMLElement | null = null;
  /** False until the scroll container is resolved after the first render. */
  #ready = false;

  #optionsEffect = effect(() => {
    const count = this.shVirtualScroll();
    this.window.setOverscan(this.virtualOverscan());
    this.window.setAxis(this.virtualAxis());
    this.window.setCount(count, this.virtualEstimate());
    untracked(() => this.#updateWindow());
  });

  constructor() {
    // Hook up after the first render: the scroll container is resolved from
    // computed styles, which only exist once component styles are applied.
    afterNextRender(() => {
      this.#scroller = null; // discard any pre-render resolution
      this.#ready = true;
      const scroller = this.#resolveScroller();
      this.#unlistenScroll = this.#renderer.listen(scroller, 'scroll', () => this.#onScroll());

      if (typeof ResizeObserver !== 'undefined') {
        this.#hostResizeObserver = new ResizeObserver(() => this.#updateWindow());
        this.#hostResizeObserver.observe(scroller);
      }
      this.#updateWindow();
    });

    // Measure the mounted rows after every render: sizes only exist once the
    // browser has laid the slice out, and any re-render may change them.
    // A changed measurement re-derives the window at the current scroll
    // position; `measure` reports no change once sizes settle, so the
    // measure → render → measure loop converges.
    afterEveryRender({
      read: () => {
        const rows = this.#rowElements();
        if (rows.length && this.window.measureElements(rows, this.window.start())) {
          this.#updateWindow();
        }
      },
    });
  }

  /** Recompute the window now (e.g. after an imperative `window.splice`). */
  refresh(): void {
    this.#updateWindow();
  }

  /** Scroll the container so the item at `index` sits at the start of the viewport. */
  scrollToIndex(index: number): void {
    const scroller = this.#resolveScroller();
    const offset = this.window.heights.prefixHeight(index);
    if (this.vertical()) scroller.scrollTop = offset;
    else scroller.scrollLeft = offset;
  }

  #onScroll(): void {
    if (this.#scrollScheduled) return;
    this.#scrollScheduled = true;
    const run = () => {
      if (!this.#scrollScheduled) return;
      this.#scrollScheduled = false;
      this.#updateWindow();
    };
    requestAnimationFrame(run);
    // rAF is paused in hidden documents; the timeout keeps the window honest there.
    setTimeout(run, 32);
  }

  #updateWindow(): void {
    if (!this.#ready) return;
    const host = this.#host.nativeElement;
    const scroller = this.#resolveScroller();
    const vertical = this.vertical();
    const viewportSize = vertical ? scroller.clientHeight : scroller.clientWidth;

    if (scroller === host) {
      this.window.update(vertical ? host.scrollTop : host.scrollLeft, viewportSize);
      return;
    }

    // The host lives inside the scroller: the viewport's edge in host-content
    // coordinates is the rect delta. The host's border-box top does not move
    // with its own spacer padding, so this stays correct as the window pads.
    const hostRect = host.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const offset = vertical ? scrollerRect.top - hostRect.top : scrollerRect.left - hostRect.left;
    this.window.update(offset, viewportSize);
  }

  /**
   * The scroll container: the host itself when it scrolls, else the nearest
   * ancestor with `overflow: auto|scroll` on the active axis, else the host.
   */
  #resolveScroller(): HTMLElement {
    if (this.#scroller) return this.#scroller;
    const host = this.#host.nativeElement;
    if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') return host;
    const scrolls = (el: HTMLElement) => {
      const style = getComputedStyle(el);
      const overflow = this.vertical() ? style.overflowY : style.overflowX;
      return overflow === 'auto' || overflow === 'scroll';
    };
    let resolved: HTMLElement | null = scrolls(host) ? host : null;
    for (let node = host.parentElement; !resolved && node; node = node.parentElement) {
      if (scrolls(node)) resolved = node;
    }
    const scroller = resolved ?? host;
    this.#scroller = scroller;
    return scroller;
  }

  /** The host's element children are the rendered rows. */
  #rowElements(): HTMLElement[] {
    return Array.from(this.#host.nativeElement.children) as HTMLElement[];
  }

  ngOnDestroy(): void {
    this.#ready = false; // a scheduled scroll callback firing post-destroy becomes a no-op
    this.#unlistenScroll?.();
    this.#hostResizeObserver?.disconnect();
  }
}
