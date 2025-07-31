import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent, ShipTooltipDirective } from '@ship-ui/core';

@Component({
  selector: 'app-scrolled-tooltip',
  imports: [ShipIconComponent, ShipButtonComponent, ShipTooltipDirective],
  templateUrl: './scrolled-tooltip.component.html',
  styleUrl: './scrolled-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrolledTooltipComponent {
  #selfRef = inject(ElementRef);

  ngOnAfterViewInit() {
    // this.#selfRef.nativeElement.scrollTo(1000, 0);
  }
}
