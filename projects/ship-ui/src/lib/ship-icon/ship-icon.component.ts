import { AfterContentInit, ChangeDetectionStrategy, Component, ElementRef, inject, Renderer2 } from '@angular/core';

const iconTypes = ['bold', 'thin', 'light', 'fill'];

@Component({
  selector: 'sh-icon',
  standalone: true,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipIconComponent implements AfterContentInit {
  #selfRef: ElementRef<HTMLElement> = inject(ElementRef);
  #renderer = inject(Renderer2);

  ngAfterContentInit(): void {
    const textContent = this.#selfRef.nativeElement.textContent?.trim();

    if (!textContent) return;

    const potentialType = textContent.split('-').at(-1);

    if (potentialType && iconTypes.includes(potentialType)) {
      this.#renderer.addClass(this.#selfRef.nativeElement, potentialType);
    }
  }
}
