import { Directive, effect, ElementRef, HostListener, inject, output, signal } from '@angular/core';

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
  #placeholderEl = signal<HTMLElement | null>(null);

  dragStartIndex = signal<number>(-1);
  dragToIndex = signal<number>(-1);
  dragables = signal<HTMLElement[]>([]);
  dragablesHeights = signal<number[]>([]);
  afterDrop = output<AfterDropResponse>();

  abortController: AbortController | null = null;

  draggingEffect = effect(() => {
    const currentDragPosIndex = this.dragToIndex();
    const startIndex = this.dragStartIndex();

    if (currentDragPosIndex > -1 && startIndex > -1) {
      const dragables = this.dragables();
      const draggedElement = dragables[startIndex];
      const parentElement = this.#selfEl.nativeElement; // Get the parent element

      const parentStyle = window.getComputedStyle(parentElement);
      const gapValue = parseFloat(parentStyle.gap) || 0;

      const totalShift = draggedElement.offsetHeight + gapValue;
      let placeholderElementShift = 0;

      if (currentDragPosIndex > startIndex) {
        for (let i = startIndex + 1; i <= currentDragPosIndex; i++) {
          placeholderElementShift += dragables[i].offsetHeight + gapValue;
        }
      } else if (currentDragPosIndex < startIndex) {
        for (let i = startIndex - 1; i >= currentDragPosIndex; i--) {
          placeholderElementShift -= dragables[i].offsetHeight + gapValue;
        }
      }

      if (this.#placeholderEl()) {
        this.#placeholderEl()!.style.transform = `translateY(${placeholderElementShift}px)`;
      }

      for (let i = 0; i < dragables.length; i++) {
        if (i === startIndex || i === dragables.length - 1) {
          continue; // Skip the dragged element
        } else if (currentDragPosIndex > startIndex && currentDragPosIndex >= i && startIndex < i) {
          dragables[i].style.transform = `translateY(-${totalShift}px)`;
        } else if (currentDragPosIndex < startIndex && currentDragPosIndex <= i && startIndex > i) {
          dragables[i].style.transform = `translateY(${totalShift}px)`;
        } else {
          dragables[i].style.transform = 'translateY(0)';
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
    // Find the closest draggable ancestor
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
        // If it's a sorting handle, find the closest draggable ancestor
        draggedElement = targetElement.closest('[draggable]') as HTMLElement;
      } else {
        // If not a sorting handle, use the target element itself
        draggedElement = targetElement;

        // If the dragged element's parent contains a sort-handle, prevent dragging
        if (draggedElement.parentElement?.querySelector('[sort-handle]') !== null) {
          e.preventDefault();
          return;
        }

        // If the target element is not draggable, prevent default drag behavior
        if (!draggedElement.draggable) {
          e.preventDefault();
          return;
        }
      }

      const draggedElementIndex = this.getIndexOfElement(draggedElement);
      this.dragStartIndex.set(draggedElementIndex);
      this.dragables()[draggedElementIndex].style.opacity = '0';
      this.dragables()[draggedElementIndex].style.zIndex = '2';
      this.#selfEl.nativeElement.classList.add('dragging');

      setTimeout(() => {
        const placeholderElement = draggedElement.cloneNode(true) as HTMLElement;
        placeholderElement.classList.add('spk-placeholder');
        placeholderElement.style.left = `${draggedElement.offsetLeft}px`;
        placeholderElement.style.width = `${draggedElement.offsetWidth}px`;
        placeholderElement.style.top = `${draggedElement.offsetTop}px`;
        placeholderElement.style.zIndex = '1';
        placeholderElement.style.opacity = '.4';
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

  @HostListener('drop', ['$event'])
  drop(e: DragEvent) {
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
    for (let index = 0; index < this.dragables().length; index++) {
      this.dragables()[index].style.transform = '';
      this.dragables()[index].style.opacity = '1';
      this.dragables()[index].style.zIndex = '1';
    }
  }

  #dragableObserver = new MutationObserver((mutations) => {
    for (var mutation of mutations) {
      if (mutation.type == 'childList') {
        this.dragables.set(Array.from(this.#selfEl.nativeElement.querySelectorAll('[draggable]')));
        this.dragablesHeights.set(
          this.dragables().map((el) => {
            return el.offsetHeight;
          })
        );
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
