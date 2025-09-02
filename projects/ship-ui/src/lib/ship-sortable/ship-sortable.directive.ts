import {
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  HostListener,
  inject,
  output,
  Renderer2,
  signal,
} from '@angular/core';

export type AfterDropResponse = {
  fromIndex: number;
  toIndex: number;
};

@Directive({
  selector: '[shSortable]',
  standalone: true,
})
export class ShipSortableDirective {
  #document = inject(DOCUMENT);
  #selfEl = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #placeholderEl = signal<HTMLElement | null>(null);
  #ghostEl = signal<HTMLElement | null>(null);
  #parentGap = signal<number>(0);

  dragStartIndex = signal<number>(-1);
  dragToIndex = signal<number>(-1);
  dragables = signal<HTMLElement[]>([]);
  afterDrop = output<AfterDropResponse>();

  abortController: AbortController | null = null;
  isDropping = false;

  draggingEffect = effect(() => {
    const currentDragPosIndex = this.dragToIndex();
    const startIndex = this.dragStartIndex();
    const dragables = this.dragables();

    if (currentDragPosIndex > -1 && startIndex > -1 && dragables.length > 0) {
      const placeholderEl = this.#placeholderEl();
      const gapValue = this.#parentGap();
      const draggedElement = dragables[startIndex];

      if (!draggedElement) return;

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
          this.#renderer.setStyle(placeholderEl, 'transform', newTransform);
        }
      }

      for (let i = 0; i < dragables.length; i++) {
        if (i === startIndex) continue;

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

    for (const el of els) {
      el.addEventListener('dragstart', (e) => this.dragStart(e), { signal: this.abortController.signal });
      el.addEventListener('dragend', () => this.dragEnd(), { signal: this.abortController.signal });
    }
  });

  getIndexOfElement(element: HTMLElement) {
    return this.dragables().findIndex((el) => el === element);
  }

  dragStart(e: DragEvent) {
    if (e.target && e.dataTransfer) {
      const targetElement = e.target as HTMLElement;
      const currentTarget = this.#document.elementFromPoint(e.clientX, e.clientY);
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

      e.dataTransfer.effectAllowed = 'move';

      const ghostElement = draggedElement.cloneNode(true) as HTMLElement;
      this.#ghostEl.set(ghostElement);
      this.#renderer.addClass(ghostElement, 'sortable-ghost');
      this.#renderer.setStyle(ghostElement, 'position', 'absolute');
      this.#renderer.setStyle(ghostElement, 'top', '0');
      this.#renderer.setStyle(ghostElement, 'left', '-9999px');
      this.#renderer.appendChild(this.#selfEl.nativeElement, ghostElement);
      e.dataTransfer.setDragImage(ghostElement, e.offsetX, e.offsetY);

      const parentStyle = window.getComputedStyle(draggedElement.parentElement!);
      this.#parentGap.set(parseFloat(parentStyle.gap) || 0);
      const draggedElementIndex = this.getIndexOfElement(draggedElement);
      this.dragStartIndex.set(draggedElementIndex);
      this.dragToIndex.set(draggedElementIndex);

      this.#renderer.addClass(draggedElement, 'sortable-dragged-el');
      this.#renderer.addClass(this.#selfEl.nativeElement, 'dragging');

      queueMicrotask(() => {
        const placeholderElement = draggedElement.cloneNode(true) as HTMLElement;
        this.#renderer.addClass(placeholderElement, 'sortable-placeholder');
        this.#renderer.removeClass(placeholderElement, 'sortable-dragged-el');
        this.#renderer.setStyle(placeholderElement, 'left', `${draggedElement.offsetLeft}px`);
        this.#renderer.setStyle(placeholderElement, 'width', `${draggedElement.offsetWidth}px`);
        this.#renderer.setStyle(placeholderElement, 'top', `${draggedElement.offsetTop}px`);
        this.#renderer.setStyle(placeholderElement, 'zIndex', '1');
        this.#placeholderEl.set(placeholderElement);
        this.#selfEl.nativeElement.appendChild(placeholderElement);
      });
    }
  }

  ngOnInit() {
    if (typeof MutationObserver !== 'undefined') {
      (this.#dragableObserver as MutationObserver).observe(this.#selfEl.nativeElement, { childList: true });
    }
  }

  @HostListener('dragover', ['$event'])
  dragOver(e: DragEvent) {
    e.preventDefault();

    e.dataTransfer!.dropEffect = 'move';

    const startIndex = this.dragStartIndex();
    if (startIndex === -1) {
      return;
    }

    const draggables = this.dragables();
    const draggedElement = draggables[startIndex];

    const targetElement = draggables.find((child) => {
      if (child === draggedElement) {
        return false;
      }
      const rect = child.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2;
    });

    if (!targetElement) {
      const lastIndex = draggables.length - 1;
      if (this.dragToIndex() !== lastIndex) {
        this.dragToIndex.set(lastIndex);
      }
      return;
    }

    let potentialToIndex = this.getIndexOfElement(targetElement);

    if (startIndex < potentialToIndex) {
      potentialToIndex--;
    }

    if (this.dragToIndex() !== potentialToIndex) {
      this.dragToIndex.set(potentialToIndex);
    }
  }

  @HostListener('drop')
  drop() {
    if (this.dragStartIndex() !== -1 && this.dragToIndex() !== -1 && this.dragStartIndex() !== this.dragToIndex()) {
      this.isDropping = true;
      this.afterDrop.emit({ fromIndex: this.dragStartIndex(), toIndex: this.dragToIndex() });
    }
  }

  dragEnd() {
    this.#cleanupDragState();
  }

  #cleanupDragState() {
    const placeholder = this.#placeholderEl();
    const ghost = this.#ghostEl();

    if (placeholder) {
      this.#renderer.removeChild(this.#selfEl.nativeElement, placeholder);
      this.#placeholderEl.set(null);
    }

    if (ghost) {
      this.#renderer.removeChild(this.#selfEl.nativeElement, ghost);
      this.#ghostEl.set(null);
    }

    // We no longer reset styles here to prevent flicker.
    // The MutationObserver will handle it after the DOM is updated.
    if (!this.isDropping) {
      this.#resetStyles();
    }

    this.dragStartIndex.set(-1);
    this.dragToIndex.set(-1);
    this.#renderer.removeClass(this.#selfEl.nativeElement, 'dragging');
  }

  #resetStyles() {
    const dragables = this.dragables();
    for (const el of dragables) {
      this.#renderer.setStyle(el, 'transform', '');
      this.#renderer.removeClass(el, 'sortable-dragged-el');
    }
  }

  #dragableObserver =
    typeof MutationObserver !== 'undefined' &&
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const draggableElements = Array.from(
            this.#selfEl.nativeElement.querySelectorAll('[draggable]:not(.sortable-placeholder):not(.sortable-ghost)')
          ) as HTMLElement[];
          this.dragables.set(draggableElements);

          if (this.isDropping) {
            // The drop is complete and Angular has updated the DOM.
            // Now we can safely reset the styles and the flag.
            this.#resetStyles();
            this.isDropping = false;
          }
        }
      }
    });

  ngOnDestroy() {
    (this.#dragableObserver as MutationObserver)?.disconnect();
    this.abortController?.abort();
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
