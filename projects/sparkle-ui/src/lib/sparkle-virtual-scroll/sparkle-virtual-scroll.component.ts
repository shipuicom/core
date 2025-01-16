import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Renderer2,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';

@Component({
  selector: 'spk-virtual-scroll',
  imports: [],
  template: `
    <div class="viewport" #viewport (scroll)="onScroll()">
      <div class="total-height" [style.height]="totalHeight() + 'px'"></div>
      <div class="items-container" [style.transform]="'translateY(' + translateY() + 'px)'">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleVirtualScrollComponent {
  #changeRef = inject(ChangeDetectorRef);
  #renderer = inject(Renderer2);
  #hostElement = inject(ElementRef);

  viewportRef = viewChild.required<ElementRef<HTMLDivElement>>('viewport');
  itemElements = viewChildren<ElementRef>('item');

  bufferSize = signal(10);

  itemHeights = signal<number[]>([]);
  startIndex = signal(0);
  endIndex = signal(0);
  translateY = signal(0);
  totalHeight = computed(() => this.itemHeights().reduce((sum, height) => sum + height, 0));
  numberOfRenderedItems = signal(0);

  #resizeObserver: ResizeObserver | null = null;
  #hostResizeObserver: ResizeObserver | null = null;

  #itemHeightsEffect = effect(() => {
    const startIndex = this.startIndex();
    const endIndex = this.endIndex();
    const itemHeights = this.itemHeights();

    if (startIndex > 0 && endIndex > 0 && itemHeights.length > 0) {
      let newTranslateY = 0;
      for (let i = 0; i < startIndex; i++) {
        newTranslateY += itemHeights[i];
      }
      this.translateY.set(newTranslateY);
    }
  });

  #totalHeightEffect = effect(() => {
    const _ = this.totalHeight();
    this.#changeRef.detectChanges();
  });

  #itemElementsEffect = effect(() => {
    const itemElements = this.itemElements();

    if (this.#resizeObserver && itemElements) {
      this.#resizeObserver.disconnect();
      const heights = new Array(itemElements.length).fill(0);
      this.numberOfRenderedItems.set(itemElements.length);
      this.itemHeights.set(heights);

      for (let i = 0; i < itemElements.length; i++) {
        this.#resizeObserver.observe(itemElements[i].nativeElement);
        heights[i] = itemElements[i].nativeElement.offsetHeight;
      }

      this.itemHeights.set(heights);
      this.#calculateVisibleItems();
    }
  });

  ngAfterViewInit() {
    this.#setupHostResizeObserver();
    this.#setupResizeObserver();
    this.#changeRef.detectChanges();
  }

  onScroll() {
    this.#calculateVisibleItems();
  }

  #setupHostResizeObserver() {
    this.#hostResizeObserver = new ResizeObserver((entries) => {
      const hostElement = entries[0];
      if (hostElement) {
        const newHeight = hostElement.contentRect.height;
        this.#renderer.setStyle(this.viewportRef().nativeElement, 'height', `${newHeight}px`);
      }
    });

    this.#hostResizeObserver.observe(this.#hostElement.nativeElement);
  }

  #setupResizeObserver() {
    this.#resizeObserver = new ResizeObserver((entries) => {
      const newHeights = [...this.itemHeights()];

      let didUpdate = false;

      for (const entry of entries) {
        const index = this.itemElements().findIndex((el) => el.nativeElement === entry.target);

        if (index !== undefined && index !== -1) {
          const newHeight = entry.contentRect.height;
          if (newHeights[index] !== newHeight) {
            newHeights[index] = newHeight;
            didUpdate = true;
          }
        }
      }

      if (didUpdate) {
        this.itemHeights.set(newHeights);
        this.#calculateVisibleItems();
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

  #calculateVisibleItems() {
    const nativeElement = this.viewportRef();
    if (!nativeElement) return;

    const scrollTop = nativeElement.nativeElement.scrollTop;
    const viewportHeight = nativeElement.nativeElement.clientHeight;

    let accumulatedHeight = 0;
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < this.itemHeights().length; i++) {
      const itemHeight = this.itemHeights()[i];

      if (startIndex === -1 && accumulatedHeight + itemHeight >= scrollTop - this.bufferSize()) {
        startIndex = i;
      }

      if (endIndex === -1 && accumulatedHeight >= scrollTop + viewportHeight + this.bufferSize()) {
        endIndex = i;
        break;
      }

      accumulatedHeight += itemHeight;
    }

    if (endIndex === -1) {
      endIndex = this.itemHeights().length - 1;
    }

    if (this.startIndex() !== startIndex) {
      this.startIndex.set(startIndex);
    }
    if (this.endIndex() !== endIndex) {
      this.endIndex.set(endIndex);
    }
  }

  ngOnDestroy() {
    this.#cleanupResizeObserver();
    this.#cleanupHostResizeObserver();
  }
}
