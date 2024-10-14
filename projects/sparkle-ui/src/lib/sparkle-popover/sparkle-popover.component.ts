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

// TODOS
// - Dynamic location where if outside of the window automatically position it to the top or left

@Component({
  selector: 'spk-popover',
  standalone: true,
  imports: [SparkleButtonComponent],
  template: `
    <div class="popover-trigger" #triggerRef [style.anchor-name]="id()" (click)="isActive.set(!isActive())">
      <div class="popover-trigger-wrapper">
        <ng-content select="[popover-trigger]" />
      </div>

      <button spk-button class="outlined">Open popover</button>
    </div>

    <div class="popover" #popoverRef [style.position-anchor]="id()" [style]="menuStyle()" popover>
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparklePopoverComponent {
  #BASE_SPACE = 4;
  SUPPORTS_ANCHOR = CSS.supports('position-anchor', '--abc') && CSS.supports('anchor-name', '--abc');

  above = input<boolean>(false);
  right = input<boolean>(false);
  isActive = model<boolean>(false);

  triggerRef = viewChild.required<ElementRef<HTMLElement>>('triggerRef');
  popoverRef = viewChild.required<ElementRef<HTMLElement>>('popoverRef');

  id = signal('--' + crypto.randomUUID());
  menuStyle = signal<any>(null);

  isCalculatingPosition = computed(() => {
    const popoverEl = this.popoverRef()?.nativeElement;

    if (this.isActive()) {
      popoverEl.showPopover();
      return true;
    } else {
      popoverEl.hidePopover();
      this.abortController?.abort();
      return false;
    }
  });

  abortController: AbortController | null = null;
  calcPositionEffect = effect(
    () => {
      const isCalculatingPosition = this.isCalculatingPosition();

      if (!isCalculatingPosition || this.SUPPORTS_ANCHOR) return;

      if (this.abortController) {
        this.abortController.abort();
      }

      this.abortController = new AbortController();

      this.calculateMenuPosition();

      const scrollableParent = this.#findScrollableParent(this.popoverRef()?.nativeElement);

      scrollableParent.addEventListener('scroll', () => this.calculateMenuPosition(), {
        signal: this.abortController?.signal,
      });

      document.addEventListener('resize', () => this.calculateMenuPosition(), {
        signal: this.abortController?.signal,
      });
    },
    {
      allowSignalWrites: true,
    }
  );

  scrollableStyles = ['scroll', 'auto'];
  #findScrollableParent(element: HTMLElement) {
    let parent = element.parentElement;

    while (parent) {
      if (
        this.scrollableStyles.indexOf(window.getComputedStyle(parent).overflowY) > -1 &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return document.documentElement;
  }

  ngOnDestroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private calculateMenuPosition() {
    if (this.isActive()) {
      const triggerRect = this.triggerRef()?.nativeElement.getBoundingClientRect();
      const menuRect = this.popoverRef()?.nativeElement.getBoundingClientRect();

      const actionLeftInViewport = triggerRect.left;
      const actionBottomInViewport = triggerRect.bottom;

      let newLeft = actionLeftInViewport;
      let newTop = actionBottomInViewport + this.#BASE_SPACE;

      const outOfBoundsRight = newLeft + menuRect.width > window.innerWidth;
      const outOfBoundsBottom = newTop + menuRect.height > window.innerHeight;

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
