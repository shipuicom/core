import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';

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
      if (typeof el?.scrollTo === 'function') {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 250);
  }
}
