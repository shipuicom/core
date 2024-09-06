import { Directive, effect, ElementRef, HostListener, inject, output, Renderer2, signal } from '@angular/core';

export type AfterDropResponse = {
  fromIndex: number;
  toIndex: number;
};

@Directive({
  selector: '[spkSortable]',
  standalone: true,
})
export class SparkleSortableDirective {
  #selfEl = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #placeholderEl = signal<HTMLElement | null>(null);
  #parentGap = signal<number>(0);

  dragStartIndex = signal<number>(-1);
  dragToIndex = signal<number>(-1);
  dragables = signal<HTMLElement[]>([]);
  afterDrop = output<AfterDropResponse>();

  abortController: AbortController | null = null;

  draggingEffect = effect(() => {
    const currentDragPosIndex = this.dragToIndex();
    const startIndex = this.dragStartIndex();

    if (currentDragPosIndex > -1 && startIndex > -1) {
      const dragables = this.dragables();
      const placeholderEl = this.#placeholderEl();
      const gapValue = this.#parentGap();
      const draggedElement = dragables[startIndex];

      const totalShift = draggedElement.offsetHeight + gapValue;
      let placeholderElShift = 0;

      if (currentDragPosIndex > startIndex) {
        for (let i = startIndex + 1; i <= currentDragPosIndex; i++) {
          placeholderElShift += dragables[i].offsetHeight + gapValue;
        }
      } else if (currentDragPosIndex < startIndex) {
        for (let i = startIndex - 1; i >= currentDragPosIndex; i--) {
          placeholderElShift -= dragables[i].offsetHeight + gapValue;
        }
      }

      if (placeholderEl) {
        const newTransform = `translateY(${placeholderElShift}px)`;

        if (placeholderEl.style.transform !== newTransform) {
          this.#renderer.setStyle(placeholderEl!, 'transform', newTransform);
        }
      }

      for (let i = 0; i < dragables.length; i++) {
        if (i === startIndex || i === dragables.length - 1) continue;

        let newTransform = 'translateY(0)';

        if (currentDragPosIndex > startIndex && currentDragPosIndex >= i && startIndex < i) {
          newTransform = `translateY(${-totalShift}px)`;
        } else if (currentDragPosIndex < startIndex && currentDragPosIndex <= i && startIndex > i) {
          newTransform = `translateY(${totalShift}px)`;
        }

        if (dragables[i].style.transform !== newTransform) {
          this.#renderer.setStyle(dragables[i], 'transform', newTransform);
        }
      }
    }
  });

  draggablesEffect = effect(() => {
    const els = this.dragables();

    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    for (let index = 0; index < els.length; index++) {
      els[index].addEventListener('dragstart', (e) => this.dragStart(e), {
        signal: this.abortController.signal,
      });
      els[index].addEventListener('dragenter', (e) => this.dragEnter(e), {
        signal: this.abortController.signal,
        capture: true,
      });
    }
  });

  getIndexOfElement(element: HTMLElement) {
    return this.dragables().findIndex((el) => el == element);
  }

  dragEnter(e: DragEvent) {
    const draggableAncestor = (e.target as HTMLElement).closest('[draggable]');

    if (draggableAncestor && !draggableAncestor.classList.contains('spk-placeholder')) {
      this.dragToIndex.set(this.getIndexOfElement(draggableAncestor as HTMLElement));
    }
  }

  dragStart(e: DragEvent) {
    if (e.target) {
      const targetElement = e.target as HTMLElement;
      const currentTarget = document.elementFromPoint(e.clientX, e.clientY);

      const isSortingHandle =
        currentTarget?.hasAttribute('sort-handle') || currentTarget?.closest('[sort-handle]') !== null;

      let draggedElement: HTMLElement;

      if (isSortingHandle) {
        draggedElement = targetElement.closest('[draggable]') as HTMLElement;
      } else {
        draggedElement = targetElement;

        if (draggedElement.parentElement?.querySelector('[sort-handle]') !== null || !draggedElement.draggable) {
          e.preventDefault();
          return;
        }
      }

      const parentStyle = window.getComputedStyle(draggedElement.parentElement!);
      this.#parentGap.set(parseFloat(parentStyle.gap) || 0);

      const draggedElementIndex = this.getIndexOfElement(draggedElement);
      this.dragStartIndex.set(draggedElementIndex);
      this.#renderer.setStyle(this.dragables()[draggedElementIndex], 'opacity', '0');
      this.#renderer.setStyle(this.dragables()[draggedElementIndex], 'zIndex', '2');
      this.#renderer.addClass(this.#selfEl.nativeElement, 'dragging');

      setTimeout(() => {
        const placeholderElement = draggedElement.cloneNode(true) as HTMLElement;
        this.#renderer.addClass(placeholderElement, 'spk-placeholder');
        this.#renderer.setStyle(placeholderElement, 'left', `${draggedElement.offsetLeft}px`);
        this.#renderer.setStyle(placeholderElement, 'width', `${draggedElement.offsetWidth}px`);
        this.#renderer.setStyle(placeholderElement, 'top', `${draggedElement.offsetTop}px`);
        this.#renderer.setStyle(placeholderElement, 'zIndex', '1');
        this.#renderer.setStyle(placeholderElement, 'opacity', '.4');
        this.#placeholderEl.set(placeholderElement);
        this.#selfEl.nativeElement.appendChild(placeholderElement);
      });
    }
  }

  ngOnInit() {
    this.#dragableObserver.observe(this.#selfEl.nativeElement, {
      childList: true,
      subtree: false,
    });
  }

  @HostListener('dragover', ['$event'])
  dragOver(e: DragEvent) {
    e.preventDefault();
  }

  @HostListener('drop')
  drop() {
    this.#resetStyles();

    this.afterDrop.emit({
      fromIndex: this.dragStartIndex(),
      toIndex: this.dragToIndex(),
    });

    this.dragStartIndex.set(-1);
    this.dragToIndex.set(-1);
    (this.#selfEl.nativeElement as HTMLElement).classList.remove('dragging');

    if (this.#placeholderEl()) {
      (this.#selfEl.nativeElement as HTMLElement).removeChild(this.#placeholderEl()!);
    }
  }

  #resetStyles() {
    const dragables = this.dragables();

    for (let i = 0; i < dragables.length; i++) {
      const el = dragables[i];
      this.#renderer.setStyle(el, 'transform', '');
      this.#renderer.setStyle(el, 'opacity', '1');
      this.#renderer.setStyle(el, 'zIndex', '1');
    }
  }

  #dragableObserver = new MutationObserver((mutations) => {
    for (var mutation of mutations) {
      if (mutation.type == 'childList') {
        this.dragables.set(Array.from(this.#selfEl.nativeElement.querySelectorAll('[draggable]')));
      }
    }
  });

  ngOnDestroy() {
    this.#dragableObserver.disconnect();

    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

export function moveIndex<T = any>(array: T[], event: AfterDropResponse): T[] {
  const { fromIndex, toIndex } = event;

  if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex >= array.length) {
    return array;
  }

  const newArray = [...array];
  const [removedItem] = newArray.splice(fromIndex, 1);

  newArray.splice(toIndex, 0, removedItem);

  return newArray;
}
