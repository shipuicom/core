import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipIconSize, ShipSheetVariant } from '../utilities/ship-types';

const iconTypes = ['bold', 'thin', 'light', 'fill', 'duotone'];

@Component({
  selector: 'sh-icon',
  standalone: true,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipIcon implements AfterContentInit {
  #selfRef: ElementRef<HTMLElement> = inject(ElementRef);
  #renderer = inject(Renderer2);

  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  size = input<ShipIconSize | null>(null);

  hostClasses = shipComponentClasses('icon', {
    color: this.color,
    variant: this.variant,
    size: this.size,
  });

  ngAfterContentInit(): void {
    const textContent = this.#selfRef.nativeElement.textContent?.trim();

    if (!textContent) return;

    const potentialType = textContent.split('-').at(-1);

    if (potentialType && iconTypes.includes(potentialType)) {
      this.#renderer.addClass(this.#selfRef.nativeElement, potentialType);
    }
  }
}
