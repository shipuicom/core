import {
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  Renderer2,
  signal,
} from '@angular/core';

export type AfterDropResponse = {
  fromIndex: number;
  toIndex: number;
};

export type CrossDropResponse = {
  previousContainer: ShipSortable;
  currentContainer: ShipSortable;
  previousIndex: number;
  currentIndex: number;
};

@Directive({
  selector: '[shSortable]',
  standalone: true,
})
export class ShipSortable implements OnInit, OnDestroy {
  static activeSource: ShipSortable | null = null;
  static activeDraggedElement: HTMLElement | null = null;
  static activeTarget: ShipSortable | null = null;

  sortableGroup = input<string>();
  sortableData = input<any>();

  #document = inject(DOCUMENT);
  #selfEl = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #placeholderEl = signal<HTMLElement | null>(null);
  #ghostEl = signal<HTMLElement | null>(null);

  dragStartIndex = signal<number>(-1);
  dragToIndex = signal<number>(-1);
  initialPositions = signal<{ x: number; y: number }[]>([]);
  dragables = signal<HTMLElement[]>([]);

  afterDrop = output<AfterDropResponse>();
  crossDrop = output<CrossDropResponse>();

  abortController: AbortController | null = null;
  isDropping = false;
  isCrossTarget = false;

  draggingEffect = effect(() => {
    const currentDragPosIndex = this.dragToIndex();
    const startIndex = this.dragStartIndex();
    const dragables = this.dragables();
    const positions = this.initialPositions();

    if (currentDragPosIndex > -1 && dragables.length > 0 && positions.length > 0) {
      const placeholderEl = this.#placeholderEl();

      // Ensure positions are valid
      if (positions.length <= currentDragPosIndex) return;
      const targetPos = positions[currentDragPosIndex];
      const startPos = startIndex > -1 ? positions[startIndex] : positions[positions.length - 1]; // Fallback to end for cross target

      if (placeholderEl && targetPos && startPos) {
        const pDx = targetPos.x - startPos.x;
        const pDy = targetPos.y - startPos.y;
        const newTransform = `translate(${pDx}px, ${pDy}px)`;
        if (placeholderEl.style.transform !== newTransform) {
          this.#renderer.setStyle(placeholderEl, 'transform', newTransform);
        }
      }

      for (let i = 0; i < dragables.length; i++) {
        if (i === startIndex && !this.isCrossTarget) continue;

        let targetVisualIndex = i;
        if (startIndex > -1) {
          // Internal drop layout logic
          if (currentDragPosIndex > startIndex && i > startIndex && i <= currentDragPosIndex) {
            targetVisualIndex = i - 1;
          } else if (currentDragPosIndex < startIndex && i >= currentDragPosIndex && i < startIndex) {
            targetVisualIndex = i + 1;
          }
        } else if (this.isCrossTarget) {
          // External drop target logic
          if (i >= currentDragPosIndex) {
            targetVisualIndex = i + 1;
          }
        }

        if (targetVisualIndex < positions.length && positions[i]) {
          const dx = positions[targetVisualIndex].x - positions[i].x;
          const dy = positions[targetVisualIndex].y - positions[i].y;
          const newTransform = `translate(${dx}px, ${dy}px)`;

          if (dragables[i].style.transform !== newTransform) {
            this.#renderer.setStyle(dragables[i], 'transform', newTransform);
          }
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

      ShipSortable.activeSource = this;
      ShipSortable.activeDraggedElement = draggedElement;
      ShipSortable.activeTarget = this;

      this.isCrossTarget = false;

      const positions = Array.from(this.dragables()).map((el) => ({
        x: el.offsetLeft,
        y: el.offsetTop,
      }));
      this.initialPositions.set(positions);

      const ghostElement = draggedElement.cloneNode(true) as HTMLElement;
      this.#ghostEl.set(ghostElement);
      this.#renderer.addClass(ghostElement, 'sortable-ghost');
      this.#renderer.setStyle(ghostElement, 'position', 'absolute');
      this.#renderer.setStyle(ghostElement, 'top', '0');
      this.#renderer.setStyle(ghostElement, 'left', '-9999px');
      this.#renderer.appendChild(this.#selfEl.nativeElement, ghostElement);
      e.dataTransfer.setDragImage(ghostElement, e.offsetX, e.offsetY);

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
        this.#renderer.setStyle(placeholderElement, 'height', `${draggedElement.offsetHeight}px`);
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

  @HostListener('dragenter', ['$event'])
  dragEnter(e: DragEvent) {
    if (!ShipSortable.activeSource || ShipSortable.activeSource === this) return;

    const sourceGroup = ShipSortable.activeSource.sortableGroup();
    const currentGroup = this.sortableGroup();

    if (sourceGroup && currentGroup && sourceGroup === currentGroup) {
      ShipSortable.activeTarget = this;
      ShipSortable.activeSource.dragToIndex.set(-1);

      // Setup Target Placeholder if we are just entering
      if (!this.isCrossTarget) {
        this.isCrossTarget = true;
        this.#renderer.addClass(this.#selfEl.nativeElement, 'dragging');

        // Compute cross-target positions by temporarily appending the active ghost to measure layout flow
        const sourceElement = ShipSortable.activeDraggedElement!;
        const tempElement = sourceElement.cloneNode(true) as HTMLElement;
        this.#renderer.setStyle(tempElement, 'visibility', 'hidden');
        this.#renderer.setStyle(tempElement, 'opacity', '0');
        this.#renderer.removeClass(tempElement, 'sortable-dragged-el');
        this.#selfEl.nativeElement.appendChild(tempElement);

        // Refresh dragables with temp included locally
        const currentElements = Array.from(
          this.#selfEl.nativeElement.querySelectorAll('[draggable]:not(.sortable-placeholder):not(.sortable-ghost)')
        ) as HTMLElement[];

        const positions = currentElements.map((el) => ({
          x: el.offsetLeft,
          y: el.offsetTop,
        }));

        this.initialPositions.set(positions);
        this.#renderer.removeChild(this.#selfEl.nativeElement, tempElement);

        // create cross target placeholder
        const placeholderElement = sourceElement.cloneNode(true) as HTMLElement;
        this.#renderer.addClass(placeholderElement, 'sortable-placeholder');
        this.#renderer.removeClass(placeholderElement, 'sortable-dragged-el');

        // Position at the very end conceptually mapping to positions length
        const endPos = positions[positions.length - 1];
        if (endPos) {
          this.#renderer.setStyle(placeholderElement, 'left', `${endPos.x}px`);
          this.#renderer.setStyle(placeholderElement, 'top', `${endPos.y}px`);
        }
        this.#renderer.setStyle(placeholderElement, 'width', `${sourceElement.offsetWidth}px`);
        this.#renderer.setStyle(placeholderElement, 'height', `${sourceElement.offsetHeight}px`);
        this.#renderer.setStyle(placeholderElement, 'zIndex', '1');
        this.#placeholderEl.set(placeholderElement);
        this.#selfEl.nativeElement.appendChild(placeholderElement);

        this.dragToIndex.set(this.dragables().length);
      }
    }
  }

  @HostListener('dragover', ['$event'])
  dragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';

    if (ShipSortable.activeTarget !== this) return;

    let targetElement: HTMLElement | undefined;
    const draggables = this.dragables();

    targetElement = draggables.find((child) => {
      if (child === ShipSortable.activeDraggedElement) {
        return false;
      }
      const rect = child.getBoundingClientRect();
      // 2D distance calculation for grid layouts
      return e.clientY >= rect.top && e.clientY <= rect.bottom && e.clientX >= rect.left && e.clientX <= rect.right;
    });

    if (!targetElement) {
      // if not exactly overlapping, fallback to closest vertical to avoid dropping out of bounds
      targetElement = draggables.find((child) => {
        if (child === ShipSortable.activeDraggedElement) return false;
        const rect = child.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2;
      });
    }

    if (!targetElement) {
      const lastIndex = draggables.length;
      if (this.dragToIndex() !== lastIndex) {
        this.dragToIndex.set(lastIndex);
      }
      return;
    }

    let potentialToIndex = this.getIndexOfElement(targetElement);

    if (this.dragStartIndex() > -1 && this.dragStartIndex() < potentialToIndex) {
      potentialToIndex--;
    }

    if (this.dragToIndex() !== potentialToIndex) {
      this.dragToIndex.set(potentialToIndex);
    }
  }

  @HostListener('drop')
  drop() {
    if (!ShipSortable.activeSource) return;

    if (ShipSortable.activeSource === this) {
      // Internal Drop
      if (this.dragStartIndex() !== -1 && this.dragToIndex() !== -1 && this.dragStartIndex() !== this.dragToIndex()) {
        this.isDropping = true;
        this.afterDrop.emit({ fromIndex: this.dragStartIndex(), toIndex: this.dragToIndex() });
      }
    } else if (ShipSortable.activeTarget === this && this.isCrossTarget) {
      // Cross Drop
      this.isDropping = true;
      ShipSortable.activeSource.isDropping = true;
      this.crossDrop.emit({
        previousContainer: ShipSortable.activeSource,
        currentContainer: this,
        previousIndex: ShipSortable.activeSource.dragStartIndex(),
        currentIndex: this.dragToIndex(),
      });
    }
  }

  dragEnd() {
    if (ShipSortable.activeSource) {
      ShipSortable.activeSource.#cleanupDragState();
    }
    if (ShipSortable.activeTarget && ShipSortable.activeTarget !== ShipSortable.activeSource) {
      ShipSortable.activeTarget.#cleanupDragState();
    }

    ShipSortable.activeSource = null;
    ShipSortable.activeTarget = null;
    ShipSortable.activeDraggedElement = null;
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

    if (!this.isDropping) {
      this.#resetStyles();
    }

    this.dragStartIndex.set(-1);
    this.dragToIndex.set(-1);
    this.isCrossTarget = false;
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
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              const draggableElements = Array.from(
                this.#selfEl.nativeElement.querySelectorAll(
                  '[draggable]:not(.sortable-placeholder):not(.sortable-ghost)'
                )
              ) as HTMLElement[];
              this.dragables.set(draggableElements);

              if (this.isDropping) {
                // Safely reset styles on DOM change
                this.#resetStyles();
                this.isDropping = false;

                if (ShipSortable.activeSource === this) {
                  ShipSortable.activeSource = null;
                }
              }
            }
          }
        })
      : undefined;

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

export function transferArrayItem<T = any>(
  currentArray: T[],
  targetArray: T[],
  currentIndex: number,
  targetIndex: number
): void {
  const [item] = currentArray.splice(currentIndex, 1);
  if (item) {
    targetArray.splice(targetIndex, 0, item);
  }
}
