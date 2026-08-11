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
   * Height of the software keyboard overlapping the layout viewport — the
   * sheet rides on top of it so bottom-pinned content (toolbars, inputs)
   * stays reachable. 0 on desktop and while the keyboard is closed.
   */
  keyboardInset = signal(0);
  #visualHeight = signal<number | null>(null);

  readonly sheetTransform = computed(() => {
    const offset = this.sheetOffset();
    return offset > 0 ? `translateY(${offset}px)` : null;
  });

  /**
   * The dialog's containing block is the *large* viewport — on iOS Safari
   * that extends behind the bottom URL bar. `100lvh - 100dvh` lifts the sheet
   * above whatever browser chrome currently overlays the page, and the JS
   * `keyboardInset` stacks the software keyboard on top (the keyboard moves
   * only the visual viewport, which no CSS unit tracks).
   */
  readonly sheetBottomInset = computed(() => `calc(100lvh - 100dvh + ${this.keyboardInset()}px)`);

  /** With the keyboard open the sheet caps to the visible band instead of dvh. */
  readonly sheetMaxHeight = computed(() => {
    if (this.defaultOptionMerge().type !== 'bottom-sheet') return null;
    const visual = this.#visualHeight();
    if (this.keyboardInset() > 0 && visual) return `${Math.round(visual - 12)}px`;
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
      // The transition (enabled while not dragging) animates the snap back.
      this.sheetOffset.set(0);
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

  #onVisualViewport = () => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    this.keyboardInset.set(Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height)));
    this.#visualHeight.set(vv.height);
  };

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

      // The software keyboard shrinks only the visual viewport; the sheet
      // tracks it so its bottom edge (and pinned toolbars) stay visible.
      if (this.defaultOptionMerge().type === 'bottom-sheet' && typeof window !== 'undefined' && window.visualViewport) {
        this.#onVisualViewport();
        window.visualViewport.addEventListener('resize', this.#onVisualViewport, {
          signal: this.abortController?.signal,
        });
      }
    } else {
      dialogEl.close();
      this.keyboardInset.set(0);
      this.#visualHeight.set(null);

      queueMicrotask(() => this.closed.emit());
    }
  });

  ngOnDestroy() {
    this.abortController?.abort();
  }
}
