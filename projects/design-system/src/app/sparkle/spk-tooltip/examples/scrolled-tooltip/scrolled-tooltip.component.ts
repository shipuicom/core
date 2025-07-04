import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import {
  SparkleButtonComponent,
  SparkleIconComponent,
  SparkleTooltipDirective,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-scrolled-tooltip',
  imports: [SparkleIconComponent, SparkleButtonComponent, SparkleTooltipDirective],
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
