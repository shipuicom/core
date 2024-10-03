import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { SparkleButtonComponent } from '../sparkle-button/sparkle-button.component';

export type SparkleSidenavType = 'overlay' | 'simple' | '';

@Component({
  selector: 'spk-sidenav',
  standalone: true,
  imports: [SparkleButtonComponent],
  template: `
    <div #dragImageElement class="drag-image"></div>

    @if (isDragging()) {
      <div
        class="dropping-surface"
        (drop)="drop($event)"
        (dragover)="dragOver($event)"
        (dragenter)="dragEnter()"
        (dragleave)="dragLeave()"></div>
    }

    <div class="sidenav">
      <ng-content select="[sidenav]"></ng-content>
    </div>

    <div class="main-wrap" [style.transform]="draggingStyle()">
      @if (!disableDrag()) {
        <div
          class="dragable"
          draggable="true"
          (dragstart)="dragStart($event)"
          (dragend)="dragEnd($event)"
          (drag)="drag($event)"
          (touchstart)="touchStart($event)"
          (touchmove)="touchMove($event)"
          (touchend)="touchEnd($event)"
          (touchcancel)="touchCancel($event)"></div>
      }

      <div class="closed-topbar">
        <ng-content select="[sidenav-closed-topbar]"></ng-content>
      </div>

      <main>
        <ng-content></ng-content>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.open]': 'isOpen()',
    '[class.overlay]': 'type() === "overlay"',
    '[class.simple]': 'type() === "simple"',
    '[class.is-dragging]': 'isDragging()',
  },
})
export class SparkleSidenavComponent {
  openWidth = 280;
  openWidthTreshold = this.openWidth * 0.9;

  disableDrag = input<boolean>(false);
  isOpen = model<boolean>(false);
  type = input<SparkleSidenavType>('');

  dragImageElement = viewChild.required<ElementRef<HTMLDivElement>>('dragImageElement');
  dragIsEnding = signal<boolean>(false);
  dragIsOnScreen = signal<boolean>(true);
  isDragging = signal<boolean>(false);
  dragPositionX = signal<number>(0);
  dragActualPositionX = computed(() => {
    const dragPosition = this.dragPositionX();
    const overdragFactor = 0.32;

    if (dragPosition > this.openWidthTreshold) {
      return this.openWidthTreshold + (dragPosition - this.openWidthTreshold) * overdragFactor;
    }

    return dragPosition;
  });

  draggingStyle = computed(() => {
    if (this.isDragging()) {
      return `translateX(${this.dragActualPositionX()}px)`;
    }

    return this.isOpen() && this.type() === 'overlay' ? `translateX(${this.openWidth}px)` : `translateX(0px)`;
  });

  draggingEffect = effect(() => {
    // Disable scrolling when dragging
    if (this.isDragging()) {
      document.body.classList.add('dragging');
    }
  });

  drop(e: DragEvent) {
    e.stopPropagation();
    this.#drop(e.clientX);
  }

  #drop(clientX: number) {
    this.isDragging.set(false);
    if (clientX <= 0) {
      this.isOpen.set(false);
    } else if (clientX > this.openWidthTreshold) {
      this.isOpen.set(true);
    } else if (clientX < this.openWidthTreshold) {
      if (!this.isOpen() && clientX < this.openWidthTreshold * 0.6) {
        this.isOpen.set(true);
      } else {
        this.isOpen.set(false);
      }
    }
  }

  dragEnd(e: DragEvent) {
    if (e.clientX < 0 || !this.dragIsOnScreen()) {
      this.#drop(0);
    }
  }

  dragEnter() {
    this.dragIsOnScreen.set(true);
  }

  dragLeave() {
    this.dragIsOnScreen.set(false);
  }

  dragOver(e: DragEvent) {
    e.preventDefault();

    this.#setDragImage(e);
  }

  dragStart(e: DragEvent) {
    e.stopPropagation();

    this.isDragging.set(true);
    this.#setDragImage(e);
  }

  #setDragImage(e: DragEvent) {
    e.dataTransfer?.setDragImage(this.dragImageElement().nativeElement, 0, 0);
  }

  drag(e: DragEvent) {
    e.stopPropagation();

    setTimeout(() => {
      this.isDragging() && this.dragIsOnScreen() && this.dragPositionX.set(e.clientX);
    });

    this.#setDragImage(e);
  }

  touchStart(e: TouchEvent) {
    e.stopPropagation();
    this.isDragging.set(true);
  }

  touchMove(e: TouchEvent) {
    e.stopPropagation();

    setTimeout(() => {
      this.isDragging() && this.dragIsOnScreen() && this.dragPositionX.set(e.touches[0].clientX);
    });
  }

  touchEnd(e: TouchEvent) {
    e.stopPropagation();
    this.#drop(e.changedTouches[0].clientX);
  }

  touchCancel(e: TouchEvent) {
    e.stopPropagation();
    this.isDragging.set(false);
  }
}
