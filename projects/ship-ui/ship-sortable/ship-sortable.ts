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
  WritableSignal,
} from '@angular/core';
import { firstValueFrom, isObservable, Observable } from 'rxjs';

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

export type ShipDropEvent = {
  previousContainer: ShipSortable;
  container: ShipSortable;
  previousIndex: number;
  currentIndex: number;
};

export interface SortableManagerConfig {
  /**
   * If provided, this hook is evaluated before the Signals are modified.
   * Return `true`/`Observable<true>` to accept the drop, or false to reject.
   */
  onBeforeDrop?: (event: ShipDropEvent) => boolean | Promise<boolean> | Observable<boolean>;
}

export function createSortableManager<T>(
  signals: WritableSignal<T[]> | Record<string, WritableSignal<T[]>>,
  config?: SortableManagerConfig
) {
  const isSingle = typeof signals === 'function';

  return {
    async drop(event: ShipDropEvent) {
      // 1. Await API Authorization (RxJS or Promises)
      if (config?.onBeforeDrop) {
        const result = config.onBeforeDrop(event);
        let accept = false;

        if (isObservable(result)) {
          accept = await firstValueFrom(result);
        } else if (result instanceof Promise) {
          accept = await result;
        } else {
          accept = result;
        }

        if (!accept) return; // Drop rejected, UI stays exactly as it was
      }

      // 2. Perform UI Signal Update
      const isCrossDrop = event.previousContainer !== event.container;

      if (!isCrossDrop) {
        // Internal Reorder (moveIndex)
        let targetSignal: WritableSignal<T[]>;
        if (isSingle) {
          targetSignal = signals as WritableSignal<T[]>;
        } else {
          const id = event.container.sortableGroup() || '';
          targetSignal = (signals as Record<string, WritableSignal<T[]>>)[id];
        }

        if (targetSignal) {
          targetSignal.update((arr) => moveIndex(arr, event));
        }
      } else {
        // Cross DropTransfer
        if (isSingle) {
          console.warn('Cross drops require a dictionary of signals in createSortableManager');
          return;
        }

        const sourceId = event.previousContainer.sortableGroup() || '';
        const targetId = event.container.sortableGroup() || '';
        const sigDict = signals as Record<string, WritableSignal<T[]>>;

        const sourceSignal = sigDict[sourceId];
        const targetSignal = sigDict[targetId];

        if (sourceSignal && targetSignal) {
          const sourceArr = [...sourceSignal()];
          const targetArr = [...targetSignal()];

          const [item] = sourceArr.splice(event.previousIndex, 1);
          if (item) {
            targetArr.splice(event.currentIndex, 0, item);
            sourceSignal.set(sourceArr);
            targetSignal.set(targetArr);
          }
        }
      }
    },
  };
}

@Directive({
  selector: '[shSortable]',
  standalone: true,
  host: {
    class: 'sh-sortable',
  },
})
export class ShipSortable implements OnInit, OnDestroy {
  #document = inject(DOCUMENT);
  #selfEl = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #crossSpacerEl = signal<HTMLElement | null>(null);

  shSortable = input<any>();
  sortableGroup = input<string>();

  sortDrop = output<ShipDropEvent>();
  afterDrop = output<AfterDropResponse>();
  crossDrop = output<CrossDropResponse>();

  dragStartIndex = signal<number>(-1);
  dragToIndex = signal<number>(-1);
  initialPositions = signal<{ x: number; y: number; width: number; height: number }[]>([]);
  dragables = signal<HTMLElement[]>([]);

  static activeSource: ShipSortable | null = null;
  static activeDraggedElement: HTMLElement | null = null;
  static activeTarget: ShipSortable | null = null;

  abortController: AbortController | null = null;
  isDropping = false;
  isCrossTarget = false;

  draggingEffect = effect(() => {
    const currentDragPosIndex = this.dragToIndex();
    const startIndex = this.dragStartIndex();
    const dragables = this.dragables();
    const positions = this.initialPositions();

    if (currentDragPosIndex > -1 && positions.length > 0) {
      this.#renderer.removeClass(this.#selfEl.nativeElement, 'item-dragged-out');

      let ghostEl: HTMLElement | null = null;
      let ghostStartPosIndex = -1;

      if (!this.isCrossTarget && startIndex > -1 && dragables.length > startIndex) {
        ghostEl = dragables[startIndex];
        ghostStartPosIndex = startIndex;
      } else if (this.isCrossTarget && this.#crossSpacerEl()) {
        ghostEl = this.#crossSpacerEl();
        ghostStartPosIndex = positions.length - 1;
      }

      for (let i = 0; i < dragables.length; i++) {
        if (i === startIndex && !this.isCrossTarget) continue;

        const targetVisualIndex = this.getVisualIndexOfElement(i);

        if (targetVisualIndex < positions.length && positions[i]) {
          const dx = positions[targetVisualIndex].x - positions[i].x;
          const dy = positions[targetVisualIndex].y - positions[i].y;
          const newTransform = `translate(${dx}px, ${dy}px)`;

          if (dragables[i].style.transform !== newTransform) {
            this.#renderer.setStyle(dragables[i], 'transform', newTransform);
          }
        }
      }

      if (ghostEl && ghostStartPosIndex > -1 && positions[currentDragPosIndex] && positions[ghostStartPosIndex]) {
        const dx = positions[currentDragPosIndex].x - positions[ghostStartPosIndex].x;
        const dy = positions[currentDragPosIndex].y - positions[ghostStartPosIndex].y;
        const newTransform = `translate(${dx}px, ${dy}px)`;
        if (ghostEl.style.transform !== newTransform) {
          this.#renderer.setStyle(ghostEl, 'transform', newTransform);
        }
      }
    } else if (startIndex > -1 && currentDragPosIndex === -1 && !this.isCrossTarget) {
      this.#renderer.addClass(this.#selfEl.nativeElement, 'item-dragged-out');

      for (let i = 0; i < dragables.length; i++) {
        if (dragables[i].style.transform !== '') {
          this.#renderer.setStyle(dragables[i], 'transform', '');
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

      const containerRect = this.#selfEl.nativeElement.getBoundingClientRect();
      const container = this.#selfEl.nativeElement;
      const positions = Array.from(this.dragables()).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          x: rect.left - containerRect.left - container.clientLeft + container.scrollLeft,
          y: rect.top - containerRect.top - container.clientTop + container.scrollTop,
          width: rect.width,
          height: rect.height,
        };
      });
      this.initialPositions.set(positions);

      const rect = draggedElement.getBoundingClientRect();

      const dragOffsetX = Math.max(0, e.clientX - rect.left);
      const dragOffsetY = Math.max(0, e.clientY - rect.top);

      e.dataTransfer.setDragImage(draggedElement, dragOffsetX, dragOffsetY);

      const draggedElementIndex = this.getIndexOfElement(draggedElement);
      this.dragStartIndex.set(draggedElementIndex);
      this.dragToIndex.set(draggedElementIndex);

      setTimeout(() => {
        this.#renderer.addClass(draggedElement, 'sortable-ghost');
        this.#renderer.addClass(this.#selfEl.nativeElement, 'dragging');
      }, 0);
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

    const sourceManager = ShipSortable.activeSource.shSortable();
    const currentManager = this.shSortable();

    const isSameGroup = !!(sourceGroup && currentGroup && sourceGroup === currentGroup);
    const isSameManager = !!(sourceManager?.drop && currentManager?.drop && sourceManager === currentManager);

    if (isSameGroup || isSameManager) {
      ShipSortable.activeTarget = this;
      ShipSortable.activeSource.dragToIndex.set(-1);

      // Setup Target Placeholder if we are just entering
      if (!this.isCrossTarget) {
        this.isCrossTarget = true;
        this.#renderer.addClass(this.#selfEl.nativeElement, 'dragging');

        // Compute cross-target positions by temporarily appending the active ghost to measure layout flow
        const sourceElement = ShipSortable.activeDraggedElement!;
        const tempElement = sourceElement.cloneNode(true) as HTMLElement;
        this.#renderer.setStyle(tempElement, 'transform', '');

        // Ensure it doesn't have the original ghost state yet to measure flow without its potential transition scaling
        this.#renderer.removeClass(tempElement, 'sortable-ghost');
        this.#selfEl.nativeElement.appendChild(tempElement);

        // Refresh dragables with temp included locally
        const currentElements = Array.from(
          this.#selfEl.nativeElement.querySelectorAll('[draggable]:not(.sortable-spacer)')
        ) as HTMLElement[];

        const containerRect = this.#selfEl.nativeElement.getBoundingClientRect();
        const container = this.#selfEl.nativeElement;

        const positions = currentElements.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            x: rect.left - containerRect.left - container.clientLeft + container.scrollLeft,
            y: rect.top - containerRect.top - container.clientTop + container.scrollTop,
            width: rect.width,
            height: rect.height,
          };
        });

        this.initialPositions.set(positions);

        // Keep the temp element as a structural spacer to physically expand the container's height/width
        // Remove draggable so it isn't picked up by draggables() observers
        tempElement.removeAttribute('draggable');
        this.#renderer.addClass(tempElement, 'sortable-spacer');
        this.#crossSpacerEl.set(tempElement);

        this.#renderer.addClass(tempElement, 'sortable-ghost');

        this.dragToIndex.set(this.dragables().length);
      }
    }
  }

  @HostListener('dragleave', ['$event'])
  dragLeave(e: DragEvent) {
    if (!ShipSortable.activeSource || ShipSortable.activeSource === this) return;

    if (e.relatedTarget) {
      if (this.#selfEl.nativeElement.contains(e.relatedTarget as Node)) {
        return;
      }
    } else {
      const rect = this.#selfEl.nativeElement.getBoundingClientRect();
      const isOutside =
        e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
      if (!isOutside) return;
    }

    if (this.isCrossTarget) {
      this.#cleanupDragState();
      if (ShipSortable.activeTarget === this) {
        ShipSortable.activeTarget = ShipSortable.activeSource;
      }
    }
  }

  @HostListener('dragover', ['$event'])
  dragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';

    if (ShipSortable.activeTarget !== this) return;

    const container = this.#selfEl.nativeElement;
    const containerRect = container.getBoundingClientRect();

    // Convert viewport coordinates to container-relative coordinate space
    const mouseX = e.clientX - containerRect.left - container.clientLeft + container.scrollLeft;
    const mouseY = e.clientY - containerRect.top - container.clientTop + container.scrollTop;

    let closestSlotIndex = -1;
    let minDistance = Infinity;

    const positions = this.initialPositions();

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const centerX = pos.x + pos.width / 2;
      const centerY = pos.y + pos.height / 2;
      const dist = Math.hypot(mouseX - centerX, mouseY - centerY);

      if (dist < minDistance) {
        minDistance = dist;
        closestSlotIndex = i;
      }
    }

    if (closestSlotIndex !== -1 && this.dragToIndex() !== closestSlotIndex) {
      this.dragToIndex.set(closestSlotIndex);
    }
  }

  getVisualIndexOfElement(i: number): number {
    const startIndex = this.dragStartIndex();
    const currentDragPosIndex = this.dragToIndex();
    let targetVisualIndex = i;

    if (startIndex > -1) {
      if (currentDragPosIndex > startIndex && i > startIndex && i <= currentDragPosIndex) {
        targetVisualIndex = i - 1;
      } else if (currentDragPosIndex < startIndex && i >= currentDragPosIndex && i < startIndex) {
        targetVisualIndex = i + 1;
      }
    } else if (this.isCrossTarget) {
      if (i >= currentDragPosIndex) {
        targetVisualIndex = i + 1;
      }
    }
    return targetVisualIndex;
  }

  @HostListener('drop')
  drop() {
    if (!ShipSortable.activeSource) return;

    // Immediately kill drag transitions before any signal updates
    this.#renderer.removeClass(ShipSortable.activeSource.#selfEl.nativeElement, 'dragging');
    this.#renderer.removeClass(this.#selfEl.nativeElement, 'dragging');

    if (ShipSortable.activeSource === this) {
      // Internal Drop
      if (this.dragStartIndex() !== -1 && this.dragToIndex() !== -1 && this.dragStartIndex() !== this.dragToIndex()) {
        this.isDropping = true;

        const event: ShipDropEvent = {
          previousContainer: this,
          container: this,
          previousIndex: this.dragStartIndex(),
          currentIndex: this.dragToIndex(),
        };

        if (this.shSortable()?.drop) {
          this.shSortable()!.drop(event);
        } else {
          this.sortDrop.emit(event);
          this.afterDrop.emit({ fromIndex: event.previousIndex, toIndex: event.currentIndex });
        }
      }
    } else if (ShipSortable.activeTarget === this && this.isCrossTarget) {
      // Cross Drop
      this.isDropping = true;
      ShipSortable.activeSource.isDropping = true;

      const event: ShipDropEvent = {
        previousContainer: ShipSortable.activeSource,
        container: this,
        previousIndex: ShipSortable.activeSource.dragStartIndex(),
        currentIndex: this.dragToIndex(),
      };

      if (this.shSortable()?.drop) {
        this.shSortable()!.drop(event);
      } else {
        this.sortDrop.emit(event);
        this.crossDrop.emit({
          previousContainer: ShipSortable.activeSource,
          currentContainer: this,
          previousIndex: ShipSortable.activeSource.dragStartIndex(),
          currentIndex: this.dragToIndex(),
        });
      }
    }
  }

  dragEnd() {
    if (ShipSortable.activeSource) {
      ShipSortable.activeSource.#renderer.removeClass(ShipSortable.activeSource.#selfEl.nativeElement, 'dragging');
      ShipSortable.activeSource.#cleanupDragState();
    }
    if (ShipSortable.activeTarget && ShipSortable.activeTarget !== ShipSortable.activeSource) {
      ShipSortable.activeTarget.#renderer.removeClass(ShipSortable.activeTarget.#selfEl.nativeElement, 'dragging');
      ShipSortable.activeTarget.#cleanupDragState();
    }

    ShipSortable.activeSource = null;
    ShipSortable.activeTarget = null;
    ShipSortable.activeDraggedElement = null;
  }

  #cleanupDragState() {
    this.#renderer.removeClass(this.#selfEl.nativeElement, 'dragging');
    this.#renderer.removeClass(this.#selfEl.nativeElement, 'item-dragged-out');

    const crossSpacer = this.#crossSpacerEl();

    if (crossSpacer) {
      this.#renderer.removeChild(this.#selfEl.nativeElement, crossSpacer);
      this.#crossSpacerEl.set(null);
    }

    this.#resetStyles();

    this.dragStartIndex.set(-1);
    this.dragToIndex.set(-1);
    this.isCrossTarget = false;
  }

  #resetStyles() {
    const dragables = this.dragables();
    for (const el of dragables) {
      this.#renderer.setStyle(el, 'transform', '');
      this.#renderer.removeClass(el, 'sortable-ghost');
    }
  }

  #dragableObserver =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              const draggableElements = Array.from(
                this.#selfEl.nativeElement.querySelectorAll('[draggable]:not(.sortable-spacer)')
              ) as HTMLElement[];
              this.dragables.set(draggableElements);

              if (this.isDropping) {
                this.isDropping = false;
                this.#cleanupDragState();

                if (ShipSortable.activeTarget === this) {
                  ShipSortable.activeTarget = null;
                }
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

export function moveIndex<T = any>(
  array: T[],
  event: Pick<ShipDropEvent, 'previousIndex' | 'currentIndex'> | Pick<AfterDropResponse, 'fromIndex' | 'toIndex'>
): T[] {
  const fromIndex = 'previousIndex' in event ? event.previousIndex : event.fromIndex;
  const toIndex = 'currentIndex' in event ? event.currentIndex : event.toIndex;

  if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex > array.length) {
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
