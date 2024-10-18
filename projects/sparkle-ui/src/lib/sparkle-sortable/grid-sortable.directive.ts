import { Directive, ElementRef, HostListener, inject, Renderer2 } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[spkGridSortable]',
})
export class GridSortableDirective {
  #selfRef = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #draggedItem: HTMLElement | null = null;

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent) {
    this.#draggedItem = event.target as HTMLElement;
    this.updateOrder(); // Initialize order for all children
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent) {
    const target = event.target as HTMLElement;
    if (this.#draggedItem && target !== this.#draggedItem && target.parentNode === this.#draggedItem.parentNode) {
      const parent = this.#draggedItem.parentNode as HTMLElement;
      const draggedIndex = Array.from(parent.children).indexOf(this.#draggedItem);
      const targetIndex = Array.from(parent.children).indexOf(target);

      // Update only the flipped indexes
      this.#renderer.setStyle(this.#draggedItem, 'order', targetIndex);
      this.#renderer.setStyle(target, 'order', draggedIndex);
    }
  }

  private updateOrder(excludedItem: HTMLElement | null = null) {
    const items = this.#selfRef.nativeElement.children;
    Array.from(items).forEach((item, index) => {
      if (item !== excludedItem) {
        this.#renderer.setStyle(item, 'order', index);
      }
    });
  }
}
