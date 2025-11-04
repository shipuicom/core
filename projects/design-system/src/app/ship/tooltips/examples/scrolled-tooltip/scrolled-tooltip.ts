import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { ShipButton, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-scrolled-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './scrolled-tooltip.html',
  styleUrl: './scrolled-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrolledTooltip implements AfterViewInit {
  #selfRef = inject(ElementRef);

  ngAfterViewInit() {
    const el = this.#selfRef.nativeElement;

    setTimeout(() => {
      el?.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    }, 250);
  }
}
