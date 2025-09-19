import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { generateUniqueId } from '../utilities/random-id';

// TODOS
// - Dynamic location where if outside of the window automatically position it to the top or left

export type ShipPopoverOptions = {
  width?: string;
  height?: string;
  closeOnButton?: boolean;
  closeOnEsc?: boolean;
};

const SCROLLABLE_STYLES = ['scroll', 'auto'];
const DEFAULT_OPTIONS: ShipPopoverOptions = {
  width: undefined,
  height: undefined,
  closeOnButton: true,
  closeOnEsc: true,
};

@Component({
  selector: 'sh-popover',
  imports: [],
  template: `
    <div class="trigger" #triggerRef [attr.popovertarget]="id() + 'hello'" (click)="toggleIsOpen($event)">
      <div class="trigger-wrapper">
        <ng-content select="[trigger]" />
        <ng-content select="button" />
        <ng-content select="[shButton]" />
      </div>
      <div class="trigger-anchor" [style.anchor-name]="id()"></div>
    </div>

    @if (isOpen()) {
      <div [attr.id]="id() + 'hello'" popover="manual" #popoverRef class="popover">
        <div class="overlay" (click)="eventClose($event)"></div>
        <div class="popover-content" [style.position-anchor]="id()" [style]="menuStyle()">
          <ng-content />
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.multi-layer]': 'asMultiLayer()',
  },
})
export class ShipPopoverComponent {
  #document = inject(DOCUMENT);
  #BASE_SPACE = 4;
  SUPPORTS_ANCHOR =
    typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--abc') && CSS.supports('anchor-name', '--abc');

  asMultiLayer = input<boolean>(false);
  disableOpenByClick = input<boolean>(false);
  isOpen = model<boolean>(false);

  options = input<Partial<ShipPopoverOptions>>();
  closed = output<void>();

  defaultOptionMerge = computed(() => ({
    ...DEFAULT_OPTIONS,
    ...this.options(),
  }));

  triggerRef = viewChild.required<ElementRef<HTMLElement>>('triggerRef');
  popoverRef = viewChild<ElementRef<HTMLElement>>('popoverRef');

  id = signal('--' + generateUniqueId());
  menuStyle = signal<any>(null);

  openAbort: AbortController | null = null;
  openEffect = effect(() => {
    const open = this.isOpen();

    queueMicrotask(() => {
      const popoverEl = this.popoverRef()?.nativeElement;

      if (!popoverEl) return;
      if (open) {
        if (this.openAbort) {
          this.openAbort.abort();
        }

        this.openAbort = new AbortController();
        const abortOptions = {
          signal: this.openAbort?.signal,
        };

        this.#document.addEventListener(
          'keydown',
          (e) => {
            if (e.key === 'Escape' && !this.defaultOptionMerge().closeOnEsc) {
              e.preventDefault();
            }

            if (e.key === 'Escape' && this.defaultOptionMerge().closeOnEsc) {
              this.isOpen.set(false);
            }
          },
          abortOptions
        );

        popoverEl.showPopover();

        if (!this.SUPPORTS_ANCHOR) {
          setTimeout(() => {
            const scrollableParent = this.#findScrollableParent(popoverEl);
            scrollableParent.addEventListener('scroll', () => this.#calculateMenuPosition(), abortOptions);
            window?.addEventListener('resize', () => this.#calculateMenuPosition(), abortOptions);

            this.#calculateMenuPosition();
          });
        }
      } else {
        this.closed.emit();
        this.openAbort?.abort();
        this.openAbort = null;
      }
    });
  });

  toggleIsOpen(event: MouseEvent) {
    if (!this.disableOpenByClick()) {
      event.preventDefault();
      event.stopPropagation();
      this.isOpen.set(!this.isOpen());
    }
  }

  eventClose($event: MouseEvent) {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
  }

  #findScrollableParent(element: HTMLElement) {
    let parent = element.parentElement;

    while (parent) {
      if (
        SCROLLABLE_STYLES.indexOf(window?.getComputedStyle(parent).overflowY) > -1 &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return this.#document.documentElement;
  }

  #calculateMenuPosition() {
    const triggerRect = this.triggerRef()?.nativeElement.getBoundingClientRect();
    const menuRect = this.popoverRef()?.nativeElement.getBoundingClientRect();

    if (!menuRect) return;

    const actionLeftInViewport = triggerRect.left;
    const actionBottomInViewport = triggerRect.bottom;

    let newLeft = actionLeftInViewport;
    let newTop = actionBottomInViewport + this.#BASE_SPACE;

    const outOfBoundsRight = newLeft + menuRect.width > window?.innerWidth;
    const outOfBoundsBottom = newTop + menuRect.height > window?.innerHeight;

    if (!this.SUPPORTS_ANCHOR) {
      newLeft = actionLeftInViewport;
      newTop = actionBottomInViewport + this.#BASE_SPACE;

      if (outOfBoundsBottom) {
        const _newTop = triggerRect.top - menuRect.height - this.#BASE_SPACE;
        const outOfBoundsTop = _newTop < 0;

        if (!outOfBoundsTop) newTop = _newTop;
      }

      if (outOfBoundsRight) {
        newLeft = triggerRect.right - menuRect.width;

        if (newLeft < 0) {
          newLeft = 0;
        }
      }

      const style: any = {
        left: newLeft + 'px',
        top: newTop + 'px',
      };

      this.menuStyle.set(style);
    }
  }

  ngOnDestroy() {
    this.openAbort?.abort();
    this.openAbort = null;
  }
}
