import { ChangeDetectionStrategy, Component, effect, ElementRef, input, signal, viewChild } from '@angular/core';

@Component({
  selector: 'spk-menu',
  standalone: true,
  imports: [],
  template: `
    @if (isActive()) {
      <div class="menu-backdrop" (click)="close()"></div>
    }
    <div class="action" #actionRef (click)="toggle()">
      <ng-content />
    </div>
    <div class="sparkle-popup-menu" #menuRef [style]="menuStyle()" (click)="close()">
      <ng-content select="[menu]" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'isActive()',
  },
})
export class SparkleMenuComponent {
  #BASE_SPACE = 8;
  hasBeenOpened = signal(false);
  above = input<boolean>(false);
  right = input<boolean>(false);
  isActive = signal(false);
  actionRef = viewChild.required<ElementRef<HTMLElement>>('actionRef');
  menuRef = viewChild.required<ElementRef<HTMLElement>>('menuRef');
  menuContainerRef = viewChild.required<ElementRef<HTMLElement>>('menuContainerRef');
  menuStyle = signal({
    left: '0px',
    top: '0px',
  });

  #body = document.getElementsByTagName('body')[0];

  // Only have listener when active
  #whenActive = effect(
    () => {
      const controller = new AbortController();
      const signal = controller.signal;

      if (this.isActive()) {
        this.#setMenuElement();
        this.calculateMenuPosition();
        this.hasBeenOpened.set(true);

        window.addEventListener('resize', () => this.calculateMenuPosition(), { signal });
        window.addEventListener('scroll', () => this.calculateMenuPosition(), { signal });
        window.addEventListener(
          'keydown',
          (e) => {
            if (e.key === 'Escape') {
              this.close();
            }
          },
          { signal }
        );
      } else {
        controller.abort();

        if (this.hasBeenOpened()) {
          this.#hideMenuElement();
        }
      }
    },
    { allowSignalWrites: true }
  );

  #setMenuElement() {
    this.#body.appendChild(this.menuRef().nativeElement);
  }

  #hideMenuElement() {
    this.#body.removeChild(this.menuRef().nativeElement);
  }

  ngOnInit() {
    this.#setMenuElement();
    this.#hideMenuElement();
  }

  toggle() {
    this.isActive.set(!this.isActive());
  }

  close(delay: number = 0) {
    setTimeout(() => {
      this.isActive.set(false);
    }, delay);
  }

  private calculateMenuPosition() {
    if (this.isActive()) {
      const triggerRect = this.actionRef()?.nativeElement.getBoundingClientRect();
      const menuRect = this.menuRef()?.nativeElement.getBoundingClientRect();

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

  ngOnDestroy() {
    if (this.#body.contains(this.menuRef().nativeElement)) {
      this.#hideMenuElement();
    }
  }
}
