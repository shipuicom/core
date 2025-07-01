import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  runInInjectionContext,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';

export type SparkleSidenavType = 'overlay' | 'simple' | '';
export function watchHostClass(className: string): WritableSignal<boolean> {
  const elementRef = inject(ElementRef);
  const destroyRef = inject(DestroyRef);

  const hasClass = signal(false);
  const observer =
    typeof MutationObserver !== 'undefined' &&
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          hasClass.set(elementRef.nativeElement.classList.contains(className));
        }
      });
    });

  runInInjectionContext(elementRef.nativeElement, () => {
    if (observer) {
      observer.observe(elementRef.nativeElement, { attributes: true });
    }

    hasClass.set(elementRef.nativeElement.classList.contains(className));
  });

  destroyRef.onDestroy(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  return hasClass;
}

@Component({
  selector: 'spk-sidenav',
  template: `
    @if (isOverlay()) {
      <div #dragImageElement class="drag-image"></div>
    }

    @if (isOverlay() && isDragging()) {
      <div class="dropping-surface" (drop)="drop($event)" (dragenter)="dragEnter()" (dragleave)="dragLeave()"></div>
    }

    <div class="sidenav">
      <ng-content select="[sidenav]"></ng-content>
    </div>

    <div class="main-wrap" [style.transform]="draggingStyle()">
      @if (isOverlay() && !disableDrag()) {
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
    '[class.closed]': '!isOpen()',
    '[class.is-dragging]': 'isDragging()',
  },
})
export class SparkleSidenavComponent {
  #selfRef = inject(ElementRef);
  openWidth = 280;
  openWidthTreshold = this.openWidth * 0.5;

  disableDrag = input<boolean>(false);
  isOpen = model<boolean>(false);
  isOverlay = watchHostClass('overlay');

  #closestParent = this.#selfRef.nativeElement.parentElement;
  #closestParentRect = this.#closestParent.getBoundingClientRect && this.#closestParent.getBoundingClientRect();

  dragImageElement = viewChild.required<ElementRef<HTMLDivElement>>('dragImageElement');
  dragIsEnding = signal<boolean>(false);
  dragIsOnScreen = signal<boolean>(true);
  isDragging = signal<boolean>(false);
  dragPositionX = signal<number>(0);

  dragActualPositionX = computed(() => {
    const dragPosition = this.dragPositionX();
    const openWidth = 280;
    const noEffectWidth = 100;
    const tensionFactor = 0.008;

    const center = openWidth / 2;
    const deadZoneStart = center - noEffectWidth / 2;
    const deadZoneEnd = center + noEffectWidth / 2;

    if (dragPosition > deadZoneEnd) {
      const distancePastDeadZone = dragPosition - deadZoneEnd;
      const maxTensionDistance = openWidth - deadZoneEnd;

      const dampenedDistance = maxTensionDistance * (1 - Math.exp(-tensionFactor * distancePastDeadZone));

      return deadZoneEnd + dampenedDistance;
    } else if (dragPosition < deadZoneStart) {
      const distancePastDeadZone = deadZoneStart - dragPosition;
      const maxTensionDistance = deadZoneStart;

      const dampenedDistance = maxTensionDistance * (1 - Math.exp(-tensionFactor * distancePastDeadZone));

      return deadZoneStart - dampenedDistance;
    }

    return dragPosition;
  });

  draggingStyle = computed(() => {
    if (!this.isOverlay()) return null;

    if (this.isDragging()) {
      return `translateX(${this.dragActualPositionX()}px)`;
    }

    return this.isOpen() ? `translateX(${this.openWidth}px)` : `translateX(0px)`;
  });

  draggingEffect = effect(() => {
    if (typeof document === 'undefined') return;

    if (this.isDragging()) {
      document.body.classList.add('dragging');
    } else {
      document.body.classList.remove('dragging');
    }
  });

  drop(e: DragEvent) {
    e.stopPropagation();
    this.#drop(e.clientX - this.#closestParentRect.left);
  }

  #drop(clientX: number) {
    this.isDragging.set(false);

    if (clientX >= this.openWidthTreshold) {
      this.isOpen.set(true);
    } else {
      this.isOpen.set(false);
    }
  }

  dragEnd(e: DragEvent) {
    if (e.clientX - this.#closestParentRect.left < 0) {
      this.#drop(0);
    }

    if (e.clientX - this.#closestParentRect.left > this.openWidthTreshold) {
      this.#drop(this.openWidthTreshold);
    }
  }

  dragEnter() {
    this.dragIsOnScreen.set(true);
  }

  dragLeave() {
    this.dragIsOnScreen.set(false);
  }

  dragStart(e: DragEvent) {
    e.stopPropagation();

    this.#closestParentRect = this.#closestParent.getBoundingClientRect();
    this.isDragging.set(true);
  }

  drag(e: DragEvent) {
    e.stopPropagation();

    if (!this.isDragging()) return;

    if (e.clientX !== 0 || e.clientY !== 0) {
      this.dragPositionX.set(e.clientX - this.#closestParentRect.left);
    }
  }

  touchStart(e: TouchEvent) {
    e.stopPropagation();

    this.isDragging.set(true);
    this.#closestParentRect = this.#closestParent.getBoundingClientRect();
    this.dragPositionX.set(0);
  }

  touchMove(e: TouchEvent) {
    e.stopPropagation();

    if (!this.isDragging()) return;

    this.dragPositionX.set(e.touches[0].clientX - this.#closestParentRect.left);
  }

  touchEnd(e: TouchEvent) {
    e.stopPropagation();

    this.#drop(e.changedTouches[0].clientX - this.#closestParentRect.left);
  }

  touchCancel(e: TouchEvent) {
    e.stopPropagation();

    this.isDragging.set(false);
  }
}
