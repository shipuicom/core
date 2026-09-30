import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, ElementRef, inject, Renderer2, signal, viewChild, viewChildren, ViewEncapsulation } from '@angular/core';
import { ShipVirtualWindow } from './virtual-window';

@Component({
  selector: 'sh-virtual-scroll',
  styleUrl: './ship-virtual-scroll.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: `
    <div class="viewport" #viewport tabindex="0" role="region" aria-label="Virtualized list" (scroll)="onScroll()">
      <div class="total-height" [style.height]="totalHeight() + 'px'"></div>
      <div class="items-container" [style.transform]="'translateY(' + translateY() + 'px)'">
        <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipVirtualScroll {
  #changeRef = inject(ChangeDetectorRef);
  #renderer = inject(Renderer2);
  #hostElement = inject(ElementRef);

  viewportRef = viewChild.required<ElementRef<HTMLDivElement>>('viewport');
  itemElements = viewChildren<ElementRef>('item');

  /** Pixels of content considered visible beyond each viewport edge. */
  bufferSize = signal(10);

  /**
   * The shared windowing engine — the same one `ShipVirtualScrollDirective`
   * uses and that `ShipVirtualWindow` exposes for direct use.
   */
  readonly window = new ShipVirtualWindow({ count: 0, overscan: 10 });

  readonly startIndex = this.window.start;
  readonly endIndex = this.window.end;
  readonly translateY = this.window.padStart;
  readonly totalHeight = this.window.totalSize;
  numberOfRenderedItems = signal(0);

  #resizeObserver: ResizeObserver | null = null;
  #hostResizeObserver: ResizeObserver | null = null;

  #bufferEffect = effect(() => {
    this.window.setOverscan(this.bufferSize());
  });

  #totalHeightEffect = effect(() => {
    const _ = this.totalHeight();
    this.#changeRef.detectChanges();
  });

  #itemElementsEffect = effect(() => {
    const itemElements = this.itemElements();

    if (this.#resizeObserver && itemElements) {
      this.#resizeObserver.disconnect();
      this.numberOfRenderedItems.set(itemElements.length);
      this.window.setCount(itemElements.length);

      for (const el of itemElements) {
        this.#resizeObserver.observe(el.nativeElement);
      }

      this.window.measureElements(
        itemElements.map((el) => el.nativeElement as HTMLElement),
        0
      );
      this.#updateWindow();
    }
  });

  ngAfterViewInit() {
    this.#setupHostResizeObserver();
    this.#setupResizeObserver();
    this.#changeRef.detectChanges();
  }

  onScroll() {
    this.#updateWindow();
  }

  #updateWindow() {
    const viewport = this.viewportRef()?.nativeElement;
    if (!viewport) return;
    this.window.update(viewport.scrollTop, viewport.clientHeight);
  }

  #setupHostResizeObserver() {
    if (typeof ResizeObserver === 'undefined') return;
    this.#hostResizeObserver = new ResizeObserver((entries) => {
      const hostElement = entries[0];
      if (hostElement) {
        const newHeight = hostElement.contentRect.height;
        this.#renderer.setStyle(this.viewportRef().nativeElement, 'height', `${newHeight}px`);
        this.#updateWindow();
      }
    });

    this.#hostResizeObserver.observe(this.#hostElement.nativeElement);
  }

  #setupResizeObserver() {
    if (typeof ResizeObserver === 'undefined') return;
    this.#resizeObserver = new ResizeObserver((entries) => {
      let didUpdate = false;

      for (const entry of entries) {
        const index = this.itemElements().findIndex((el) => el.nativeElement === entry.target);

        if (index !== -1) {
          didUpdate = this.window.measure(index, entry.contentRect.height) || didUpdate;
        }
      }

      if (didUpdate) {
        this.#updateWindow();
      }
    });
  }

  #cleanupResizeObserver() {
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
  }

  #cleanupHostResizeObserver() {
    if (this.#hostResizeObserver) {
      this.#hostResizeObserver.disconnect();
      this.#hostResizeObserver = null;
    }
  }

  ngOnDestroy() {
    this.#cleanupResizeObserver();
    this.#cleanupHostResizeObserver();
  }
}
