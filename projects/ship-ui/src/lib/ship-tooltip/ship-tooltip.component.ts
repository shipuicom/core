import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { generateUniqueId } from '../utilities/random-id';

@Component({
  selector: 'sh-tooltip',
  imports: [],
  template: `
    <div
      class="trigger"
      #triggerRef
      [style.anchor-name]="id()"
      (mouseover)="isOpen.set(true)"
      (mouseout)="isOpen.set(false)">
      <ng-content />
    </div>

    <div class="tooltip" #tooltipRef [style.position-anchor]="id()" [style]="menuStyle()" popover>
      {{ message() }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.above]': '_above()',
    '[class.right]': '_right()',
    '[class.disabled]': 'disabled()',
  },
})
export class ShipTooltipComponent {
  #BASE_SPACE = 4;
  SUPPORTS_ANCHOR = CSS.supports('position-anchor', '--abc') && CSS.supports('anchor-name', '--abc');

  disabled = input<boolean>(false);
  above = input<boolean>(false);
  right = input<boolean>(false);

  _above = signal<boolean>(this.above());
  _right = signal<boolean>(this.right());
  message = input.required<string>();
  isOpen = model<boolean>(false);
  closed = output<void>();

  triggerRef = viewChild.required<ElementRef<HTMLElement>>('triggerRef');
  tooltipRef = viewChild.required<ElementRef<HTMLElement>>('tooltipRef');

  id = signal('--' + generateUniqueId());
  menuStyle = signal<any>(null);

  isCalculatingPosition = computed(() => {
    const tooltipEl = this.tooltipRef()?.nativeElement;
    const open = this.isOpen();

    if (open) {
      tooltipEl?.showPopover();

      return true;
    } else {
      tooltipEl.hidePopover();
      this.abortController?.abort();
      this.closed.emit();

      return false;
    }
  });

  abortController: AbortController | null = null;
  calcPositionEffect = effect(() => {
    const isCalculatingPosition = this.isCalculatingPosition();

    if (!isCalculatingPosition) return;

    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.calculateMenuPosition();

    const scrollableParent = this.#findScrollableParent(this.tooltipRef()?.nativeElement);

    scrollableParent.addEventListener('scroll', () => this.calculateMenuPosition(), { signal });
    document.addEventListener('resize', () => this.calculateMenuPosition(), { signal });
  });

  scrollableStyles = ['scroll', 'auto'];
  #findScrollableParent(element: HTMLElement) {
    let parent = element.parentElement;

    while (parent) {
      if (
        this.scrollableStyles.indexOf(window?.getComputedStyle(parent).overflowY) > -1 &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return document.documentElement;
  }

  eventClose($event: MouseEvent) {
    $event.stopPropagation();
    $event.preventDefault();
    this.isOpen.set(false);
  }

  ngOnDestroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private calculateMenuPosition() {
    const triggerRect = this.triggerRef()?.nativeElement.getBoundingClientRect();
    const menuRect = this.tooltipRef()?.nativeElement.getBoundingClientRect();

    const actionLeftInViewport = triggerRect.left;
    const actionBottomInViewport = triggerRect.bottom;

    let newLeft = actionLeftInViewport;
    let newTop = actionBottomInViewport + this.#BASE_SPACE;

    const outOfBoundsRight = newLeft + menuRect.width > window?.innerWidth;
    const outOfBoundsBottom = newTop + menuRect.height > window?.innerHeight;

    if (this.SUPPORTS_ANCHOR) {
      this._above.set(outOfBoundsBottom);
      this._right.set(outOfBoundsRight);
    } else {
      if (this.above()) {
        const _newTop = triggerRect.top - menuRect.height - this.#BASE_SPACE;

        if (_newTop >= 0) {
          newTop = _newTop;
        }
      } else {
        if (outOfBoundsBottom) {
          newTop = triggerRect.top - menuRect.height - this.#BASE_SPACE;
        }
      }

      if (this.right()) {
        const _newLeft = triggerRect.right - menuRect.width;

        if (_newLeft >= 0) {
          newLeft = _newLeft;
        }
      } else {
        if (outOfBoundsRight) {
          newTop = outOfBoundsBottom ? triggerRect.top + triggerRect.height - menuRect.height : triggerRect.top;
          newLeft = triggerRect.left - menuRect.width - this.#BASE_SPACE;
        }
      }

      this.menuStyle.set({
        left: newLeft + 'px',
        top: newTop + 'px',
      });
    }
  }
}
