import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { ShipButtonComponent, ShipIcon, ShipTooltipDirective } from 'ship-ui';

@Component({
  selector: 'app-scrolled-tooltip',
  imports: [ShipIcon, ShipButtonComponent, ShipTooltipDirective],
  templateUrl: './scrolled-tooltip.component.html',
  styleUrl: './scrolled-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrolledTooltipComponent implements AfterViewInit {
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
