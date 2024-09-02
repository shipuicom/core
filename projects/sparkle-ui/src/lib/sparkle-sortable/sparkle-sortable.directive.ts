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
  dragStartIndex = signal<number>(-1);
  dragToIndex = signal<number>(-1);
  dragables = signal<HTMLElement[]>([]);
  afterDrop = output<AfterDropResponse>();

  abortController: AbortController | null = null;

  draggingEffect = effect(() => {
    const currentDragPosIndex = this.dragToIndex();

    if (currentDragPosIndex > -1 && this.dragStartIndex() > -1) {
      const dragables = this.dragables();

      for (let i = 0; i < dragables.length; i++) {
        if (currentDragPosIndex > this.dragStartIndex() && currentDragPosIndex >= i && this.dragStartIndex() < i) {
          dragables[i].style.transform = `translate(0, -${dragables[i].clientHeight}px)`;
        } else if (
          currentDragPosIndex < this.dragStartIndex() &&
          currentDragPosIndex <= i &&
          this.dragStartIndex() > i
        ) {
          dragables[i].style.transform = `translate(0, ${dragables[i].clientHeight}px)`;
        } else {
          dragables[i].style.transform = 'translate(0,0)';
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
      els[index].addEventListener(
        'dragenter',
        (e) => {
          if (e.target) {
            this.dragToIndex.set(this.getIndexOfElement(e.target as HTMLElement));
          }
        },
        {
          signal: this.abortController.signal,
        }
      );
    }
  });

  getIndexOfElement(element: HTMLElement) {
    return this.dragables().findIndex((el) => el == element);
  }

  dragStart(e: DragEvent) {
    if (e.target) {
      const draggedElementIndex = this.getIndexOfElement(e.target as HTMLElement);
      this.dragStartIndex.set(draggedElementIndex);
      this.dragables()[draggedElementIndex].style.opacity = '0.4';
      const copyElement = this.dragables()[draggedElementIndex].cloneNode(true) as HTMLElement;
      copyElement.classList.add('sparkle-sortable-placeholder');
      this.#placeholderEl.set(copyElement);
      this.#renderer.appendChild(this.#selfEl.nativeElement, this.#placeholderEl);
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
    this.#renderer.removeChild(this.#selfEl.nativeElement, this.#placeholderEl());
  }

  #resetStyles() {
    for (let index = 0; index < this.dragables().length; index++) {
      this.dragables()[index].style.transform = '';
      this.dragables()[index].style.opacity = '1';
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
