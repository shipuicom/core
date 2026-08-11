import { ChangeDetectionStrategy, Component, computed, DOCUMENT, effect, ElementRef, inject, input, model, output, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { SHIP_CONFIG } from '@ship-ui/core';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';

export type ShipDialogType = 'modal' | 'bottom-sheet';

export type ShipDialogOptions = {
  class?: 'default' | 'type-b' | 'type-c' | string;
  /** `'modal'` (default) centers; `'bottom-sheet'` anchors a drag-dismissable card to the bottom edge. */
  type?: ShipDialogType;
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  closeOnButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
};

const DEFAULT_OPTIONS: ShipDialogOptions = {
  class: 'default',
  type: 'modal',
  width: undefined,
  maxWidth: undefined,
  height: undefined,
  maxHeight: undefined,
  closeOnButton: true,
  closeOnEsc: true,
  closeOnOutsideClick: true,
};

/**
 * Open dialogs across the app share one scroll lock on the page: the first
 * one to open sets `overflow: hidden` on the root element, the last one to
 * close removes it — so stacked dialogs don't unlock early.
 */
let scrollLockCount = 0;
let scrollLockPrevious = '';

/** Drag farther than this fraction of the sheet's height to dismiss on release. */
const SHEET_DISMISS_FRACTION = 0.3;
/** …or release faster than this (px/ms), regardless of distance. */
const SHEET_DISMISS_VELOCITY = 0.6;
/** How long the dismiss slide runs before the dialog actually closes. */
const SHEET_DISMISS_MS = 220;

@Component({
  selector: 'sh-dialog',
  styleUrl: './ship-dialog.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: `
    @let options = this.defaultOptionMerge();

    @if (isOpen()) {
      <dialog
        shDialog
        #dialogRef
        [class]="options.class"
        [class.bottom-sheet]="options.type === 'bottom-sheet'"
        [class.sheet-dragging]="sheetDragging()"
        [class.sheet-dismissing]="sheetDismissing()"
        [style.width]="options.width ?? ''"
        [style.max-width]="options.maxWidth ?? ''"
        [style.max-height]="sheetMaxHeight() ?? options.maxHeight ?? ''"
        [style.height]="options.height ?? ''"
        [style.margin-bottom]="options.type === 'bottom-sheet' ? sheetBottomInset() : null"
        [style.transform]="sheetTransform()">
        @if (options.type === 'bottom-sheet') {
          <div
            class="sheet-handle"
            tabindex="-1"
            aria-label="Drag down to dismiss"
            (pointerdown)="sheetDragStart($event)"
            (pointermove)="sheetDragMove($event)"
            (pointerup)="sheetDragEnd($event)"
            (pointercancel)="sheetDragEnd($event)">
            <div class="sheet-handle-bar"></div>
          </div>
        }

        <div class="content">
          <ng-content />
        </div>

        @if (this.defaultOptionMerge().closeOnOutsideClick) {
          <div class="closeable-overlay" (click)="isOpen.set(false)"></div>
        }
      </dialog>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDialog {
  #document = inject(DOCUMENT);
  #shConfig = inject(SHIP_CONFIG, { optional: true });
  #keybindings = inject(ShipA11yKeybindingsService);
  dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');
  /** Whether the dialog is open. Two-way bindable. */
  isOpen = model<boolean>(false);
  /** Behaviour and sizing overrides (class, type, width, close-on-esc, etc.). */
  options = input<Partial<ShipDialogOptions>>();
  /** Emits when the dialog closes. */
  closed = output<void>();

  defaultOptionMerge = computed(() => ({
    ...DEFAULT_OPTIONS,
    ...{ class: this.#shConfig?.dialogType ?? 'default' },
    ...this.options(),
  }));

  // -- bottom-sheet state ----------------------------------------------------
  /** Pixels the sheet is currently dragged past its resting position. */
  sheetOffset = signal(0);
  sheetDragging = signal(false);
  sheetDismissing = signal(false);
  /**
   * How far the sheet is lifted off the layout-viewport bottom so its lower
   * edge sits exactly on the *visual* viewport bottom — on top of whatever
   * currently overlays the page: the software keyboard, a bottom URL bar,
   * a keyboard accessory row. Measured, not predicted: engines disagree on
   * what `innerHeight`/`dvh` include, so the sheet's own overhang below the
   * visible band is the only number that is true everywhere.
   */
  keyboardInset = signal(0);
  #visualHeight = signal<number | null>(null);

  readonly sheetTransform = computed(() => {
    const offset = this.sheetOffset();
    return offset > 0 ? `translateY(${offset}px)` : null;
  });

  readonly sheetBottomInset = computed(() => `${this.keyboardInset()}px`);

  /**
   * The card is capped to the visible band (minus breathing room) whenever
   * the visual viewport is known — so a "95dvh" sheet ends up the same
   * *visible* size on every engine, regardless of how each one accounts for
   * its own chrome in CSS viewport units.
   */
  readonly sheetMaxHeight = computed(() => {
    if (this.defaultOptionMerge().type !== 'bottom-sheet') return null;
    const visual = this.#visualHeight();
    if (visual) return `${Math.round(visual - 12)}px`;
    return this.defaultOptionMerge().maxHeight ?? null;
  });

  #dragPointerId: number | null = null;
  #dragStartY = 0;
  #dragLastY = 0;
  #dragLastT = 0;
  #dragVelocity = 0;

  sheetDragStart(event: PointerEvent) {
    if (this.sheetDismissing()) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.#dragPointerId = event.pointerId;
    this.#dragStartY = event.clientY;
    this.#dragLastY = event.clientY;
    this.#dragLastT = event.timeStamp;
    this.#dragVelocity = 0;
    this.sheetDragging.set(true);
  }

  sheetDragMove(event: PointerEvent) {
    if (this.#dragPointerId !== event.pointerId) return;
    const dt = event.timeStamp - this.#dragLastT;
    if (dt > 0) this.#dragVelocity = (event.clientY - this.#dragLastY) / dt;
    this.#dragLastY = event.clientY;
    this.#dragLastT = event.timeStamp;
    // Only downward drags move the sheet; upward pulls stay put (no rubber
    // band — the sheet is already at its resting height).
    this.sheetOffset.set(Math.max(0, event.clientY - this.#dragStartY));
  }

  sheetDragEnd(event: PointerEvent) {
    if (this.#dragPointerId !== event.pointerId) return;
    this.#dragPointerId = null;
    this.sheetDragging.set(false);

    const sheetHeight = this.dialogRef()?.nativeElement.offsetHeight ?? 0;
    const shouldDismiss =
      this.sheetOffset() > sheetHeight * SHEET_DISMISS_FRACTION || this.#dragVelocity > SHEET_DISMISS_VELOCITY;

    if (shouldDismiss && sheetHeight > 0) {
      this.dismissSheet();
    } else {
      // The transition (enabled while not dragging) animates the snap back;
      // the measurement defers itself until that transition ends.
      this.sheetOffset.set(0);
      this.#onVisualViewport();
    }
  }

  /** Slide the sheet out, then close the dialog. */
  dismissSheet() {
    if (this.sheetDismissing()) return;
    const sheetHeight = this.dialogRef()?.nativeElement.offsetHeight ?? 0;
    this.sheetDismissing.set(true);
    this.sheetOffset.set(sheetHeight + this.keyboardInset());
    setTimeout(() => {
      this.isOpen.set(false);
      this.sheetDismissing.set(false);
      this.sheetOffset.set(0);
    }, SHEET_DISMISS_MS);
  }

  /** Whether THIS dialog currently holds a share of the page scroll lock. */
  #holdsScrollLock = false;

  #lockPageScroll() {
    if (this.#holdsScrollLock) return;
    this.#holdsScrollLock = true;
    if (++scrollLockCount === 1) {
      const root = this.#document.documentElement;
      scrollLockPrevious = root.style.overflow;
      root.style.overflow = 'hidden';
    }
  }

  #unlockPageScroll() {
    if (!this.#holdsScrollLock) return;
    this.#holdsScrollLock = false;
    if (--scrollLockCount === 0) {
      this.#document.documentElement.style.overflow = scrollLockPrevious;
    }
  }

  #measureScheduled = false;

  /**
   * Feedback control instead of viewport arithmetic: measure how far the
   * sheet's bottom edge overhangs the visual viewport's bottom and fold the
   * difference into the inset. One pass converges (margin shifts the rect
   * linearly); a negative overhang (keyboard closed, URL bar collapsed)
   * lowers the sheet again, floored at the true bottom.
   */
  #onVisualViewport = () => {
    if (this.#measureScheduled) return;
    this.#measureScheduled = true;
    requestAnimationFrame(() => {
      this.#measureScheduled = false;
      this.#measureSheetInset();
    });
    // rAF is paused in hidden documents; the timeout keeps the sheet honest there.
    setTimeout(() => {
      if (!this.#measureScheduled) return;
      this.#measureScheduled = false;
      this.#measureSheetInset();
    }, 48);
  };

  #measureSheetInset() {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const dialogEl = this.dialogRef()?.nativeElement;
    if (!vv || !dialogEl || !this.isOpen()) return;
    this.#visualHeight.set(vv.height);

    // While the sheet is mid-gesture or mid-animation its rect is transformed
    // and lies about the resting position — re-measure once it settles.
    if (this.sheetDragging() || this.sheetDismissing()) return;
    if (dialogEl.getAnimations().length > 0) {
      dialogEl.addEventListener('animationend', () => this.#onVisualViewport(), { once: true });
      dialogEl.addEventListener('transitionend', () => this.#onVisualViewport(), { once: true });
      return;
    }

    const overhang = Math.round(dialogEl.getBoundingClientRect().bottom - (vv.offsetTop + vv.height));
    if (overhang !== 0) {
      this.keyboardInset.set(Math.max(0, this.keyboardInset() + overhang));
    }
  }

  abortController: AbortController | null = null;
  isOpenEffect = effect(() => {
    const dialogEl = this.dialogRef()?.nativeElement;

    if (!dialogEl) return;
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    if (this.isOpen()) {
      dialogEl.showModal();
      // The top layer doesn't stop the page behind from scrolling on its own.
      this.#lockPageScroll();
      // showModal focuses the first focusable element — in a sheet that pops
      // the software keyboard before the user asked for it. Park focus on the
      // handle instead; inputs focus on tap like a native sheet.
      if (this.defaultOptionMerge().type === 'bottom-sheet') {
        queueMicrotask(() => dialogEl.querySelector<HTMLElement>('.sheet-handle')?.focus({ preventScroll: true }));
      }
      const closeShortcut = this.#keybindings.getShortcut('dialog.close');
      if (closeShortcut) {
        dialogEl.setAttribute('aria-keyshortcuts', this.#keybindings.getDisplayShortcut('dialog.close') || closeShortcut);
      }
      dialogEl.addEventListener(
        'close',
        () => {
          this.isOpen.set(false);
          this.closed.emit();
        },
        {
          signal: this.abortController?.signal,
        }
      );

      this.#document.addEventListener(
        'keydown',
        (e) => {
          if (this.#keybindings.matches(e, 'dialog.close')) {
            if (!this.defaultOptionMerge().closeOnEsc) {
              e.preventDefault();
            } else {
              this.isOpen.set(false);
            }
          }
        },
        {
          signal: this.abortController?.signal,
        }
      );

      // Keyboard, bottom URL bars and accessory rows all move only the visual
      // viewport; the sheet re-measures against it on every geometry change
      // (resize = keyboard/bar state, scroll = pinch-zoom panning) and once
      // after the entry animation settles.
      if (this.defaultOptionMerge().type === 'bottom-sheet' && typeof window !== 'undefined' && window.visualViewport) {
        this.#onVisualViewport();
        window.visualViewport.addEventListener('resize', this.#onVisualViewport, {
          signal: this.abortController?.signal,
        });
        window.visualViewport.addEventListener('scroll', this.#onVisualViewport, {
          signal: this.abortController?.signal,
        });
      }
    } else {
      dialogEl.close();
      this.#unlockPageScroll();
      this.keyboardInset.set(0);
      this.#visualHeight.set(null);

      queueMicrotask(() => this.closed.emit());
    }
  });

  ngOnDestroy() {
    this.abortController?.abort();
    this.#unlockPageScroll();
  }
}
