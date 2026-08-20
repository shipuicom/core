import { ChangeDetectionStrategy, Component, computed, DestroyRef, DOCUMENT, effect, ElementRef, inject, input, model, signal, ViewEncapsulation } from '@angular/core';
import { classMutationSignal } from '@ship-ui/core';

export type ShipSidenavType = 'overlay' | 'simple' | '';

// Tracks how many overlay sidenavs currently hold the document scroll lock so
// two instances on the same page don't remove each other's lock.
let scrollLockCount = 0;

@Component({
  selector: 'sh-sidenav',
  styleUrl: './ship-sidenav.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="sidenav" role="navigation" [attr.aria-hidden]="sidenavIsHidden() ? 'true' : null">
      <ng-content select="[sidenav]"></ng-content>
    </div>

    <div class="main-wrap" [style.transform]="draggingStyle()">
      @if (isOverlay() && !disableDrag()) {
        <div
          class="dragable"
          role="separator"
          aria-orientation="vertical"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-label]="isOpen() ? 'Close navigation' : 'Open navigation'"
          tabindex="0"
          (keydown.enter)="isOpen.set(!isOpen())"
          (keydown.space)="$event.preventDefault(); isOpen.set(!isOpen())"
          (pointerdown)="dragPointerDown($event)"
          (pointermove)="dragPointerMove($event)"
          (pointerup)="dragPointerUp($event)"
          (pointercancel)="dragPointerCancel()"></div>
      }

      <div class="closed-topbar">
        <ng-content select="[sidenav-closed-topbar]"></ng-content>
      </div>

      <main>
        <ng-content />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.open]': 'isOpen()',
    '[class.closed]': '!isOpen()',
    '[class.is-dragging]': 'isDragging()',
    '[style.--sidenav-open-width.px]': 'openWidth()',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class ShipSidenav {
  #document = inject(DOCUMENT);
  #selfRef = inject(ElementRef);
  #destroyRef = inject(DestroyRef);

  /** When `true`, disables drag/swipe gestures for opening and closing the sidenav. */
  disableDrag = input<boolean>(false);
  /** Width in px the sidenav opens to. Also drives the drag threshold. */
  openWidth = input<number>(280);
  /** Two-way bound open/closed state of the sidenav. */
  isOpen = model<boolean>(false);
  #currentClasses = classMutationSignal();
  isOverlay = computed(() => this.#currentClasses().split(/\s+/).includes('overlay'));

  isDragging = signal<boolean>(false);
  dragPositionX = signal<number>(0);

  #openThreshold = computed(() => this.openWidth() * 0.5);
  #dragStartLeft = 0;
  #activePointerId: number | null = null;
  #holdsScrollLock = false;

  sidenavIsHidden = computed(() => this.isOverlay() && !this.isOpen() && !this.isDragging());

  dragActualPositionX = computed(() => {
    const dragPosition = this.dragPositionX();
    const openWidth = this.openWidth();
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
    if (!this.isOverlay() || this.disableDrag()) return null;

    if (this.isDragging()) {
      return `translateX(${this.dragActualPositionX()}px)`;
    }

    return this.isOpen() ? `translateX(${this.openWidth()}px)` : `translateX(0px)`;
  });

  draggingEffect = effect((onCleanup) => {
    if (this.disableDrag() || !this.isDragging()) return;

    this.#document.body.classList.add('dragging');
    onCleanup(() => this.#document.body.classList.remove('dragging'));
  });

  scrollLockEffect = effect((onCleanup) => {
    if (this.isOverlay() && this.isOpen()) {
      this.#acquireScrollLock();
    }

    onCleanup(() => this.#releaseScrollLock());
  });

  constructor() {
    this.#destroyRef.onDestroy(() => this.#releaseScrollLock());
  }

  onEscape() {
    if (this.isOverlay() && this.isOpen()) {
      this.isOpen.set(false);
    }
  }

  dragPointerDown(e: PointerEvent) {
    if (this.#activePointerId !== null) return;

    e.stopPropagation();
    e.preventDefault();

    const parent = this.#selfRef.nativeElement.parentElement;
    this.#dragStartLeft = parent?.getBoundingClientRect ? parent.getBoundingClientRect().left : 0;
    this.#activePointerId = e.pointerId;
    this.isDragging.set(true);
    this.dragPositionX.set(e.clientX - this.#dragStartLeft);

    // Routes subsequent pointer events to the handle even when the pointer
    // leaves it mid-drag. Throws for pointers the browser no longer tracks.
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* drag still works while the pointer stays over the handle */
    }
  }

  dragPointerMove(e: PointerEvent) {
    if (e.pointerId !== this.#activePointerId || !this.isDragging()) return;

    e.stopPropagation();
    this.dragPositionX.set(e.clientX - this.#dragStartLeft);
  }

  dragPointerUp(e: PointerEvent) {
    if (e.pointerId !== this.#activePointerId) return;

    e.stopPropagation();
    this.#endDrag(e.clientX - this.#dragStartLeft);
  }

  dragPointerCancel() {
    if (this.#activePointerId === null) return;

    // A cancelled gesture snaps back to the state it started from.
    this.#activePointerId = null;
    this.isDragging.set(false);
  }

  #endDrag(clientX: number) {
    this.#activePointerId = null;
    this.isDragging.set(false);
    this.isOpen.set(clientX >= this.#openThreshold());
  }

  #acquireScrollLock() {
    if (this.#holdsScrollLock) return;

    this.#holdsScrollLock = true;
    scrollLockCount++;
    this.#document.body.classList.add('sh-sidenav-open');
    this.#document.documentElement.classList.add('sh-sidenav-open');
  }

  #releaseScrollLock() {
    if (!this.#holdsScrollLock) return;

    this.#holdsScrollLock = false;
    scrollLockCount = Math.max(0, scrollLockCount - 1);

    if (scrollLockCount === 0) {
      this.#document.body.classList.remove('sh-sidenav-open');
      this.#document.documentElement.classList.remove('sh-sidenav-open');
    }
  }
}
