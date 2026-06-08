import { AfterContentInit, ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, PLATFORM_ID, Renderer2, signal, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipIconSize, SHIP_CONFIG, ShipIconConfig } from '@ship-ui/core';

const iconTypes = ['bold', 'thin', 'light', 'fill', 'duotone'];

@Component({
  selector: 'sh-icon',
  styleUrl: './ship-icon.scss',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'customHostClasses()',
    '[attr.aria-hidden]': '"true"',
  },
})
export class ShipIcon implements AfterContentInit {
  #selfRef: ElementRef<HTMLElement> = inject(ElementRef);
  #renderer = inject(Renderer2);
  #config = inject(SHIP_CONFIG, { optional: true });
  #document = inject(DOCUMENT);
  #platformId = inject(PLATFORM_ID);

  color = input<ShipColor | null>(null);

  size = input<ShipIconSize | null>(null);

  isUnfocused = signal(
    isPlatformBrowser(this.#platformId) ? !this.#document.hasFocus() : false
  );

  hostClasses = shipComponentClasses('icon', {
    color: this.color,

    size: this.size,
  });

  customHostClasses = computed(() => {
    const classes = this.hostClasses();
    const configIcon = this.#config?.icon as ShipIconConfig;
    const list = [classes];

    if (!configIcon?.disableUnfocus && this.isUnfocused()) {
      list.push('unfocused');
    }

    return list.filter(Boolean).join(' ');
  });

  @HostListener('window:blur')
  onWindowBlur() {
    this.isUnfocused.set(true);
  }

  @HostListener('window:focus')
  onWindowFocus() {
    this.isUnfocused.set(false);
  }

  ngAfterContentInit(): void {
    const textContent = this.#selfRef.nativeElement.textContent?.trim();

    if (!textContent) return;

    const potentialType = textContent.split('-').at(-1);

    if (potentialType && iconTypes.includes(potentialType)) {
      this.#renderer.addClass(this.#selfRef.nativeElement, potentialType);
    }
  }
}
