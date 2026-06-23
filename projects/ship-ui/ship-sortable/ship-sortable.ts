import {
  Injectable,
  computed,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  Renderer2,
  signal,
  WritableSignal,
} from '@angular/core';
import { firstValueFrom, isObservable, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShipSortableService {
  activeSource: ShipSortable | null = null;
  activeDraggedElement: HTMLElement | null = null;
  activeTarget: ShipSortable | null = null;
  activeInstances = new Set<ShipSortable>();
}

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

export type ShipTreeDropEvent = {
  previousIndex: number;
  currentIndex: number;
  position: 'before' | 'after' | 'inside';
};

export interface SortableManagerConfig {
  



  onBeforeDrop?: (event: ShipDropEvent) => boolean | Promise<boolean> | Observable<boolean>;
}

export function createSortableManager<T>(
  signals: WritableSignal<T[]> | Record<string, WritableSignal<T[]>>,
  config?: SortableManagerConfig
) {
  const isSingle = typeof signals === 'function';

  return {
    async drop(event: ShipDropEvent) {
      
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

        if (!accept) return; 
      }

      
      const isCrossDrop = event.previousContainer !== event.container;

      if (!isCrossDrop) {
        
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
    '[class.sh-sortable-tree]': "sortingMode() === 'tree'",
  },
})
export class ShipSortable implements OnInit, OnDestroy {
  #sortableService = inject(ShipSortableService);

  #document = inject(DOCUMENT);
  #selfEl = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #crossSpacerEl = signal<HTMLElement | null>(null);

  shSortable = input<any>();
  sortableGroup = input<string>();
  sortingMode = input<'list' | 'grid' | 'tree'>('list');
  treeItems = model<any[]>([]);

  touchEnabled = input<boolean>(false);
  touchActivation = input<'longpress' | 'handle' | 'none'>('longpress');

  sortDrop = output<ShipDropEvent>();
  afterDrop = output<AfterDropResponse>();
  crossDrop = output<CrossDropResponse>();
  treeDrop = output<ShipTreeDropEvent>();

  dragStartIndex = signal<number>(-1);
  dragToIndex = signal<number>(-1);
  treeHoverIndex = signal<number>(-1);
  treeHoverPosition = signal<'before' | 'after' | 'inside' | null>(null);
  initialPositions = signal<{ x: number; y: number; width: number; height: number }[]>([]);
  dragables = signal<HTMLElement[]>([]);


  abortController: AbortController | null = null;
  isDropping = false;
  isCrossTarget = false;

  touchDragTimer: any = null;
  touchStartCoordinates: { x: number; y: number } | null = null;
  isTouchDragging = false;
  touchGhostEl: HTMLElement | null = null;
  touchOffset = { x: 0, y: 0 };

  #boundTouchMove = this.onTouchMove.bind(this);
  #boundTouchEnd = this.onTouchEnd.bind(this);

  draggingEffect = effect(() => {
    if (this.sortingMode() === 'tree') {
      return;
    }
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
      if (this.touchEnabled()) {
        el.addEventListener('touchstart', (e) => this.onTouchStart(e, el), {
          signal: this.abortController.signal,
          passive: false,
        });
      }
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

      this.#sortableService.activeSource = this;
      this.#sortableService.activeDraggedElement = draggedElement;
      this.#sortableService.activeTarget = this;

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

      if (this.sortingMode() === 'tree') {
        const clone = draggedElement.cloneNode(true) as HTMLElement;
        clone.querySelector('.node-icon')?.remove();
        clone.querySelector('.caret-container')?.remove();
        clone.style.opacity = '0.8';
        clone.style.width = `${rect.width}px`;
        clone.style.position = 'absolute';
        clone.style.top = '-9999px';
        clone.style.left = '-9999px';
        this.#document.body.appendChild(clone);

        e.dataTransfer.setDragImage(clone, -12, -30);

        setTimeout(() => this.#document.body.removeChild(clone), 0);
      } else {
        e.dataTransfer.setDragImage(draggedElement, dragOffsetX, dragOffsetY);
      }

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
    this.#sortableService.activeInstances.add(this);
    if (typeof MutationObserver !== 'undefined') {
      (this.#dragableObserver as MutationObserver).observe(this.#selfEl.nativeElement, { childList: true });
    }
  }

  @HostListener('dragenter', ['$event'])
  dragEnter(e: DragEvent) {
    this.processDragEnter();
  }

  processDragEnter() {
    if (!this.#sortableService.activeSource || this.#sortableService.activeSource === this) return;

    const sourceGroup = this.#sortableService.activeSource.sortableGroup();
    const currentGroup = this.sortableGroup();

    const sourceManager = this.#sortableService.activeSource.shSortable();
    const currentManager = this.shSortable();

    const isSameGroup = !!(sourceGroup && currentGroup && sourceGroup === currentGroup);
    const isSameManager = !!(sourceManager?.drop && currentManager?.drop && sourceManager === currentManager);

    if (isSameGroup || isSameManager) {
      if (this.#sortableService.activeTarget && this.#sortableService.activeTarget !== this && this.#sortableService.activeTarget !== this.#sortableService.activeSource) {
        this.#sortableService.activeTarget.processDragLeave(0, 0, null, true);
      }

      this.#sortableService.activeTarget = this;
      this.#sortableService.activeSource.dragToIndex.set(-1);

      // Setup Target Placeholder if we are just entering
      if (!this.isCrossTarget) {
        this.isCrossTarget = true;
        this.#renderer.addClass(this.#selfEl.nativeElement, 'dragging');

        // Compute cross-target positions by temporarily appending the active ghost to measure layout flow
        const sourceElement = this.#sortableService.activeDraggedElement!;
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
    this.processDragLeave(e.clientX, e.clientY, e.relatedTarget as Node);
  }

  processDragLeave(clientX: number, clientY: number, relatedTarget: Node | null, force = false) {
    if (!this.#sortableService.activeSource || this.#sortableService.activeSource === this) return;

    if (!force) {
      if (relatedTarget) {
        if (this.#selfEl.nativeElement.contains(relatedTarget)) {
          return;
        }
      } else {
        const rect = this.#selfEl.nativeElement.getBoundingClientRect();
        const isOutside =
          clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom;
        if (!isOutside) return;
      }
    }

    if (this.isCrossTarget) {
      this.#cleanupDragState();
      if (this.#sortableService.activeTarget === this) {
        this.#sortableService.activeTarget = this.#sortableService.activeSource;
      }
    }
  }

  @HostListener('dragover', ['$event'])
  dragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    this.processDragOver(e.clientX, e.clientY, e.target as HTMLElement);
  }

  processDragOver(clientX: number, clientY: number, targetElementUnderTouch?: HTMLElement) {
    if (this.#sortableService.activeTarget !== this) return;

    if (this.sortingMode() === 'tree') {
      const targetElement = targetElementUnderTouch || (this.#document.elementFromPoint(clientX, clientY) as HTMLElement);
      const hoveredDraggable = targetElement?.closest('[draggable]') as HTMLElement;

      if (hoveredDraggable && this.#selfEl.nativeElement.contains(hoveredDraggable)) {
        const targetIdx = this.getIndexOfElement(hoveredDraggable);
        if (targetIdx !== -1) {
          const rect = hoveredDraggable.getBoundingClientRect();
          const relativeY = (clientY - rect.top) / rect.height;
          const isFolder =
            hoveredDraggable.hasAttribute('sortable-folder') ||
            hoveredDraggable.getAttribute('sortable-folder') === 'true' ||
            hoveredDraggable.hasAttribute('sortable-dir') ||
            hoveredDraggable.getAttribute('sortable-dir') === 'true';

          let position: 'before' | 'after' | 'inside';
          if (isFolder) {
            if (relativeY < 0.25) {
              position = 'before';
            } else if (relativeY > 0.75) {
              position = 'after';
            } else {
              position = 'inside';
            }
          } else {
            if (relativeY < 0.5) {
              position = 'before';
            } else {
              position = 'after';
            }
          }

          if (this.treeHoverIndex() !== targetIdx || this.treeHoverPosition() !== position) {
            this.#clearTreeHoverClasses();
            this.treeHoverIndex.set(targetIdx);
            this.treeHoverPosition.set(position);
            this.#renderer.addClass(hoveredDraggable, `drop-${position}`);
          }

          if (this.dragToIndex() !== targetIdx) {
            this.dragToIndex.set(targetIdx);
          }
        }
      } else {
        this.#clearTreeHoverClasses();
        this.treeHoverIndex.set(-1);
        this.treeHoverPosition.set(null);
      }
      return;
    }

    const container = this.#selfEl.nativeElement;
    const containerRect = container.getBoundingClientRect();

    // Convert viewport coordinates to container-relative coordinate space
    const mouseX = clientX - containerRect.left - container.clientLeft + container.scrollLeft;
    const mouseY = clientY - containerRect.top - container.clientTop + container.scrollTop;

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

  onTouchStart(e: TouchEvent, el: HTMLElement) {
    if (!this.touchEnabled() || this.touchActivation() === 'none') {
      return;
    }

    const touch = e.touches[0];
    const targetEl = touch.target as HTMLElement;
    const isSortingHandle = targetEl.hasAttribute('sort-handle') || targetEl.closest('[sort-handle]') !== null;

    const hasHandle = el.querySelector('[sort-handle]') !== null;
    if (hasHandle && !isSortingHandle) {
      return;
    }

    if (this.touchActivation() === 'handle') {
      if (!isSortingHandle) {
        return;
      }
      e.preventDefault();
      this.startTouchDrag(touch, el);
    } else if (this.touchActivation() === 'longpress') {
      this.touchStartCoordinates = { x: touch.clientX, y: touch.clientY };

      this.#document.addEventListener('touchmove', this.#boundTouchMove, { passive: false });
      this.#document.addEventListener('touchend', this.#boundTouchEnd, { passive: false });
      this.#document.addEventListener('touchcancel', this.#boundTouchEnd, { passive: false });

      this.touchDragTimer = setTimeout(() => {
        this.startTouchDrag(touch, el);
      }, 300);
    }
  }

  startTouchDrag(touch: Touch, el: HTMLElement) {
    this.isTouchDragging = true;

    this.#sortableService.activeSource = this;
    this.#sortableService.activeDraggedElement = el;
    this.#sortableService.activeTarget = this;

    this.isCrossTarget = false;

    const containerRect = this.#selfEl.nativeElement.getBoundingClientRect();
    const container = this.#selfEl.nativeElement;
    const positions = Array.from(this.dragables()).map((item) => {
      const rect = item.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left - container.clientLeft + container.scrollLeft,
        y: rect.top - containerRect.top - container.clientTop + container.scrollTop,
        width: rect.width,
        height: rect.height,
      };
    });
    this.initialPositions.set(positions);

    const rect = el.getBoundingClientRect();
    this.touchOffset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };

    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.8';
    ghost.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    ghost.style.margin = '0';
    ghost.style.transform = '';
    ghost.classList.add('sortable-ghost-touch');

    this.#document.body.appendChild(ghost);
    this.touchGhostEl = ghost;

    const draggedElementIndex = this.getIndexOfElement(el);
    this.dragStartIndex.set(draggedElementIndex);
    this.dragToIndex.set(draggedElementIndex);

    this.#renderer.addClass(el, 'sortable-ghost');
    this.#renderer.addClass(this.#selfEl.nativeElement, 'dragging');

    if (this.touchActivation() === 'handle') {
      this.touchStartCoordinates = { x: touch.clientX, y: touch.clientY };
      this.#document.addEventListener('touchmove', this.#boundTouchMove, { passive: false });
      this.#document.addEventListener('touchend', this.#boundTouchEnd, { passive: false });
      this.#document.addEventListener('touchcancel', this.#boundTouchEnd, { passive: false });
    }
  }

  onTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    if (!this.isTouchDragging) {
      if (this.touchStartCoordinates) {
        const dx = clientX - this.touchStartCoordinates.x;
        const dy = clientY - this.touchStartCoordinates.y;
        if (Math.hypot(dx, dy) > 8) {
          this.cancelTouchDrag();
        }
      }
      return;
    }

    e.preventDefault();

    if (this.touchGhostEl) {
      const x = clientX - this.touchOffset.x;
      const y = clientY - this.touchOffset.y;
      this.touchGhostEl.style.left = `${x}px`;
      this.touchGhostEl.style.top = `${y}px`;
    }

    const elementUnderTouch = this.#document.elementFromPoint(clientX, clientY) as HTMLElement;
    let targetInstance: ShipSortable | null = null;
    if (elementUnderTouch) {
      for (const instance of this.#sortableService.activeInstances) {
        if (instance.#selfEl.nativeElement === elementUnderTouch || instance.#selfEl.nativeElement.contains(elementUnderTouch)) {
          targetInstance = instance;
          break;
        }
      }
    }

    if (targetInstance) {
      if (this.#sortableService.activeTarget !== targetInstance) {
        if (this.#sortableService.activeTarget) {
          this.#sortableService.activeTarget.processDragLeave(clientX, clientY, null, true);
        }
        this.#sortableService.activeTarget = targetInstance;
        targetInstance.processDragEnter();
      }
      this.#sortableService.activeTarget.processDragOver(clientX, clientY, elementUnderTouch);
    } else {
      if (this.#sortableService.activeTarget && this.#sortableService.activeTarget !== this.#sortableService.activeSource) {
        this.#sortableService.activeTarget.processDragLeave(clientX, clientY, null, true);
      }
    }
  }

  onTouchEnd(e: TouchEvent) {
    const wasDragging = this.isTouchDragging;
    this.cancelTouchDrag();

    if (wasDragging) {
      this.isTouchDragging = false;

      if (this.#sortableService.activeTarget) {
        this.#sortableService.activeTarget.drop();
      }

      if (this.touchGhostEl) {
        this.touchGhostEl.remove();
        this.touchGhostEl = null;
      }

      this.dragEnd();
    }
  }

  cancelTouchDrag() {
    if (this.touchDragTimer) {
      clearTimeout(this.touchDragTimer);
      this.touchDragTimer = null;
    }
    this.touchStartCoordinates = null;

    this.#document.removeEventListener('touchmove', this.#boundTouchMove);
    this.#document.removeEventListener('touchend', this.#boundTouchEnd);
    this.#document.removeEventListener('touchcancel', this.#boundTouchEnd);
  }

  #clearTreeHoverClasses() {
    const dragables = this.dragables();
    for (const el of dragables) {
      this.#renderer.removeClass(el, 'drop-before');
      this.#renderer.removeClass(el, 'drop-after');
      this.#renderer.removeClass(el, 'drop-inside');
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
    if (!this.#sortableService.activeSource) return;

    // Immediately kill drag transitions before any signal updates
    this.#renderer.removeClass(this.#sortableService.activeSource.#selfEl.nativeElement, 'dragging');
    this.#renderer.removeClass(this.#selfEl.nativeElement, 'dragging');

    if (this.sortingMode() === 'tree') {
      this.isDropping = true;
      if (this.#sortableService.activeSource !== this) {
        this.#sortableService.activeSource.isDropping = true;
      }

      const prevIdx = this.#sortableService.activeSource.dragStartIndex();
      const currIdx = this.dragToIndex();
      const pos = this.treeHoverPosition();

      if (prevIdx !== -1 && currIdx !== -1 && pos) {
        const event: ShipTreeDropEvent = {
          previousIndex: prevIdx,
          currentIndex: currIdx,
          position: pos,
        };

        const manager = this.shSortable();
        if (manager && typeof manager.drop === 'function') {
          manager.drop(event, this.treeItems());
        } else {
          this.treeDrop.emit(event);
        }
      }

      this.#cleanupDragState();
      if (this.#sortableService.activeSource !== this) {
        this.#sortableService.activeSource.#cleanupDragState();
      }
      return;
    }

    if (this.#sortableService.activeSource === this) {
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
    } else if (this.#sortableService.activeTarget === this && this.isCrossTarget) {
      // Cross Drop
      this.isDropping = true;
      this.#sortableService.activeSource.isDropping = true;

      const event: ShipDropEvent = {
        previousContainer: this.#sortableService.activeSource,
        container: this,
        previousIndex: this.#sortableService.activeSource.dragStartIndex(),
        currentIndex: this.dragToIndex(),
      };

      if (this.shSortable()?.drop) {
        this.shSortable()!.drop(event);
      } else {
        this.sortDrop.emit(event);
        this.crossDrop.emit({
          previousContainer: this.#sortableService.activeSource,
          currentContainer: this,
          previousIndex: this.#sortableService.activeSource.dragStartIndex(),
          currentIndex: this.dragToIndex(),
        });
      }
    }
  }

  dragEnd() {
    if (this.#sortableService.activeSource) {
      this.#sortableService.activeSource.#renderer.removeClass(this.#sortableService.activeSource.#selfEl.nativeElement, 'dragging');
      this.#sortableService.activeSource.#cleanupDragState();
    }
    if (this.#sortableService.activeTarget && this.#sortableService.activeTarget !== this.#sortableService.activeSource) {
      this.#sortableService.activeTarget.#renderer.removeClass(this.#sortableService.activeTarget.#selfEl.nativeElement, 'dragging');
      this.#sortableService.activeTarget.#cleanupDragState();
    }

    this.#sortableService.activeSource = null;
    this.#sortableService.activeTarget = null;
    this.#sortableService.activeDraggedElement = null;
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
    this.#clearTreeHoverClasses();

    this.dragStartIndex.set(-1);
    this.dragToIndex.set(-1);
    this.treeHoverIndex.set(-1);
    this.treeHoverPosition.set(null);
    this.isCrossTarget = false;
  }

  #resetStyles() {
    const dragables = this.dragables();
    for (const el of dragables) {
      this.#renderer.setStyle(el, 'transform', '');
      this.#renderer.removeClass(el, 'sortable-ghost');
      this.#renderer.removeClass(el, 'drop-before');
      this.#renderer.removeClass(el, 'drop-after');
      this.#renderer.removeClass(el, 'drop-inside');
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

                if (this.#sortableService.activeTarget === this) {
                  this.#sortableService.activeTarget = null;
                }
                if (this.#sortableService.activeSource === this) {
                  this.#sortableService.activeSource = null;
                }
              }
            }
          }
        })
      : undefined;

  ngOnDestroy() {
    this.#sortableService.activeInstances.delete(this);
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

export interface TreeSortableManagerConfig<T> {
  getId?: (item: T) => string;
  getParentId?: (item: T) => string | null;
  setParentId?: (item: T, parentId: string | null) => void;
  getDepth?: (item: T) => number;
  setDepth?: (item: T, depth: number) => void;
  isFolder?: (item: T) => boolean;
  isOpen?: (item: T) => boolean;
  setIsOpen?: (item: T, isOpen: boolean) => void;
}

export function createTreeSortableManager<T>(nodesSignal: WritableSignal<T[]>, config?: TreeSortableManagerConfig<T>) {
  const getId = config?.getId || ((item: any) => item.id);
  const getParentId = config?.getParentId || ((item: any) => item.parentId);
  const setParentId = config?.setParentId || ((item: any, pid: string | null) => (item.parentId = pid));
  const isFolder = config?.isFolder || ((item: any) => item.type === 'dir');
  const getIsOpen = config?.isOpen || ((item: any) => !!item.isOpen);
  const setIsOpen =
    config?.setIsOpen ||
    ((item: any, open: boolean) => {
      item.isOpen = open;
    });

  const isDescendant = (parentId: string, childId: string, list: T[]): boolean => {
    let current = list.find((n) => getId(n) === childId);
    while (current && getParentId(current) !== null) {
      if (getParentId(current) === parentId) {
        return true;
      }
      const pid = getParentId(current);
      current = list.find((n) => getId(n) === pid);
    }
    return false;
  };

  const getSubtree = (rootId: string, list: T[]): T[] => {
    const queue = [rootId];
    const rootItem = list.find((n) => getId(n) === rootId);
    if (!rootItem) return [];

    let index = 0;
    while (index < queue.length) {
      const parentId = queue[index++];
      const children = list.filter((n) => getParentId(n) === parentId);
      for (const child of children) {
        const cid = getId(child);
        if (!queue.includes(cid)) {
          queue.push(cid);
        }
      }
    }

    return list.filter((n) => queue.includes(getId(n)));
  };

  const visibleNodes = computed(() => {
    const list = nodesSignal();
    const visible: T[] = [];

    const isNodeVisible = (node: T): boolean => {
      let currentParentId = getParentId(node);
      while (currentParentId !== null && currentParentId !== undefined) {
        const parent = list.find((n) => getId(n) === currentParentId);
        if (!parent || !getIsOpen(parent)) {
          return false;
        }
        currentParentId = getParentId(parent);
      }
      return true;
    };

    for (const node of list) {
      const parentId = getParentId(node);
      if (parentId === null || parentId === undefined || isNodeVisible(node)) {
        visible.push(node);
      }
    }
    return visible;
  });

  return {
    visibleNodes,
    drop(event: ShipTreeDropEvent, visibleNodesList: T[]) {
      const draggedItem = visibleNodesList[event.previousIndex];
      const targetItem = visibleNodesList[event.currentIndex];

      if (!draggedItem || !targetItem || getId(draggedItem) === getId(targetItem)) return;

      nodesSignal.update((allNodes) => {
        // Prevent dropping inside itself or its descendants
        if (isDescendant(getId(draggedItem), getId(targetItem), allNodes)) {
          return allNodes;
        }

        const draggedSubtree = getSubtree(getId(draggedItem), allNodes);
        const draggedIds = new Set(draggedSubtree.map((n) => getId(n)));

        const filteredNodes = allNodes.filter((n) => !draggedIds.has(getId(n)));
        const targetIdxInFiltered = filteredNodes.findIndex((n) => getId(n) === getId(targetItem));
        if (targetIdxInFiltered === -1) return allNodes;

        let newParentId: string | null = null;

        if (event.position === 'inside') {
          newParentId = getId(targetItem);

          const targetInMain = filteredNodes.find((n) => getId(n) === getId(targetItem));
          if (targetInMain) setIsOpen(targetInMain, true);
        } else {
          newParentId = getParentId(targetItem);
        }

        const updatedDraggedSubtree = draggedSubtree.map((node) => {
          const updatedNode = { ...node };
          if (getId(updatedNode) === getId(draggedItem)) {
            setParentId(updatedNode, newParentId);
          }
          return updatedNode;
        });

        if (event.position === 'before') {
          filteredNodes.splice(targetIdxInFiltered, 0, ...updatedDraggedSubtree);
        } else if (event.position === 'after') {
          const targetSubtree = getSubtree(getId(targetItem), filteredNodes);
          const insertAt = targetIdxInFiltered + targetSubtree.length;
          filteredNodes.splice(insertAt, 0, ...updatedDraggedSubtree);
        } else if (event.position === 'inside') {
          filteredNodes.splice(targetIdxInFiltered + 1, 0, ...updatedDraggedSubtree);
        }

        return filteredNodes;
      });
    },
  };
}
