import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  Injectable,
  input,
  OnDestroy,
  output,
  Renderer2,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ShipListItemSwipeService {
  activeSwipeItem: ShipListItemSwipe | null = null;
}

@Component({
  selector: 'sh-list-item-swipe',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './ship-list-item-swipe.scss',
  template: `
    <div class="sh-swipe-container">
      <div class="sh-swipe-actions actions-left" #actionsLeft>
        <ng-content select="button[actionLeft]" />
      </div>
      <div class="sh-swipe-actions actions-right" #actionsRight>
        <ng-content select="button[actionRight]" />
      </div>
      <div class="sh-swipe-content" #content>
        <ng-content />
      </div>
    </div>
  `,
  host: {
    class: 'sh-list-item-swipe',
  },
})
export class ShipListItemSwipe implements OnDestroy {
  #swipeService = inject(ShipListItemSwipeService);
  #elementRef = inject(ElementRef<HTMLElement>);
  #document = inject(DOCUMENT);
  #renderer = inject(Renderer2);

  contentEl = viewChild.required<ElementRef<HTMLElement>>('content');
  actionsLeftEl = viewChild.required<ElementRef<HTMLElement>>('actionsLeft');
  actionsRightEl = viewChild.required<ElementRef<HTMLElement>>('actionsRight');

  swipeThreshold = input<number>(0.3);

  swipeOpen = output<'left' | 'right'>();
  swipeClose = output<void>();

  #startX = 0;
  #startY = 0;
  #currentX = 0;
  #isSwiping = false;
  #isScrollLock = false;
  #hasLeftActions = false;
  #hasRightActions = false;
  #leftActionsWidth = 0;
  #rightActionsWidth = 0;

  #swipeState: 'closed' | 'open-left' | 'open-right' = 'closed';

  #boundTouchMove = this.#onTouchMove.bind(this);
  #boundTouchEnd = this.#onTouchEnd.bind(this);

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    this.#startX = touch.clientX;
    this.#startY = touch.clientY;
    this.#currentX = this.#getTranslateX();

    if (this.#swipeService.activeSwipeItem && this.#swipeService.activeSwipeItem !== this) {
      this.#swipeService.activeSwipeItem.close();
    }

    const host = this.#elementRef.nativeElement;
    this.#hasLeftActions = host.querySelector('button[actionLeft]') !== null;
    this.#hasRightActions = host.querySelector('button[actionRight]') !== null;

    this.#leftActionsWidth = this.actionsLeftEl().nativeElement.offsetWidth || 0;
    this.#rightActionsWidth = this.actionsRightEl().nativeElement.offsetWidth || 0;

    this.#isSwiping = false;
    this.#isScrollLock = false;

    this.#renderer.setStyle(this.contentEl().nativeElement, 'transition', 'none');

    this.#document.addEventListener('touchmove', this.#boundTouchMove, { passive: false });
    this.#document.addEventListener('touchend', this.#boundTouchEnd, { passive: false });
    this.#document.addEventListener('touchcancel', this.#boundTouchEnd, { passive: false });
  }

  #onTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.#startX;
    const deltaY = touch.clientY - this.#startY;

    if (!this.#isSwiping) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        this.#unbindListeners();
        return;
      }
      if (Math.abs(deltaX) > 8) {
        this.#isSwiping = true;
        this.#isScrollLock = true;

        if (this.#swipeService.activeSwipeItem && this.#swipeService.activeSwipeItem !== this) {
          this.#swipeService.activeSwipeItem.close();
        }
      }
    }

    if (this.#isScrollLock) {
      e.preventDefault();
    }

    if (this.#isSwiping) {
      let targetTranslate = this.#currentX + deltaX;

      if (targetTranslate > 0) {
        if (!this.#hasLeftActions) {
          targetTranslate = 0;
        } else if (targetTranslate > this.#leftActionsWidth) {
          targetTranslate = this.#leftActionsWidth + (targetTranslate - this.#leftActionsWidth) * 0.25;
        }
      } else if (targetTranslate < 0) {
        if (!this.#hasRightActions) {
          targetTranslate = 0;
        } else if (targetTranslate < -this.#rightActionsWidth) {
          targetTranslate = -this.#rightActionsWidth + (targetTranslate + this.#rightActionsWidth) * 0.25;
        }
      }

      this.#setTranslateX(targetTranslate);
    }
  }

  #onTouchEnd() {
    this.#unbindListeners();

    if (this.#isSwiping) {
      const currentTranslate = this.#getTranslateX();
      const threshold = this.swipeThreshold();

      if (currentTranslate > 0 && this.#hasLeftActions) {
        if (currentTranslate > this.#leftActionsWidth * threshold) {
          this.open('left');
        } else {
          this.close();
        }
      } else if (currentTranslate < 0 && this.#hasRightActions) {
        if (Math.abs(currentTranslate) > this.#rightActionsWidth * threshold) {
          this.open('right');
        } else {
          this.close();
        }
      } else {
        this.close();
      }
    }
  }

  open(side: 'left' | 'right') {
    if (side === 'left') {
      const leftWidth = this.actionsLeftEl().nativeElement.offsetWidth || 0;
      this.#animateTo(leftWidth);
      this.#swipeState = 'open-left';
      this.swipeOpen.emit('left');
      this.#swipeService.activeSwipeItem = this;
    } else {
      const rightWidth = this.actionsRightEl().nativeElement.offsetWidth || 0;
      this.#animateTo(-rightWidth);
      this.#swipeState = 'open-right';
      this.swipeOpen.emit('right');
      this.#swipeService.activeSwipeItem = this;
    }
  }

  close() {
    this.#animateTo(0);
    if (this.#swipeState !== 'closed') {
      this.#swipeState = 'closed';
      this.swipeClose.emit();
    }
    if (this.#swipeService.activeSwipeItem === this) {
      this.#swipeService.activeSwipeItem = null;
    }
  }

  #animateTo(x: number) {
    const el = this.contentEl().nativeElement;
    this.#renderer.setStyle(el, 'transition', 'transform 200ms cubic-bezier(0.25, 0.8, 0.25, 1)');
    this.#setTranslateX(x);
  }

  #setTranslateX(x: number) {
    this.#renderer.setStyle(this.contentEl().nativeElement, 'transform', `translateX(${x}px)`);
  }

  #getTranslateX(): number {
    const transform = this.contentEl().nativeElement.style.transform;
    if (!transform) return 0;
    const match = /translateX\(([^)]+)px\)/.exec(transform);
    return match ? parseFloat(match[1]) : 0;
  }

  #unbindListeners() {
    this.#document.removeEventListener('touchmove', this.#boundTouchMove);
    this.#document.removeEventListener('touchend', this.#boundTouchEnd);
    this.#document.removeEventListener('touchcancel', this.#boundTouchEnd);
  }

  ngOnDestroy() {
    this.#unbindListeners();
    if (this.#swipeService.activeSwipeItem === this) {
      this.#swipeService.activeSwipeItem = null;
    }
  }
}
