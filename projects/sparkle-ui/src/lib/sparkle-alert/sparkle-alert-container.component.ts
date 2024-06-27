import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SparkleAlertComponent } from './sparkle-alert.component';
import { SparkleAlertService } from './sparkle-alert.service';

@Component({
  selector: 'sparkle-alert-container',
  standalone: true,
  imports: [SparkleAlertComponent, MatIconModule],
  templateUrl: './sparkle-alert-container.component.html',
  styleUrl: './sparkle-alert-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleAlertContainerComponent {
  private sparkleAlertService = inject(SparkleAlertService);

  inline = input<string | null>(null);
  alerts = viewChild.required<QueryList<SparkleAlertComponent>>('alerts');
  scroller = viewChild.required<ElementRef<HTMLDivElement>>('scroller');

  alertHistory = this.sparkleAlertService.alertHistory;
  alertHistoryIsOpen = this.sparkleAlertService.alertHistoryIsOpen;
  alertHistoryIsHidden = this.sparkleAlertService.alertHistoryIsHidden;

  numberOfOpenAlerts = computed(() => {
    return this.alertHistory().filter((x) => x.isOpen).length;
  });

  constructor() {
    effect(() => {
      const _ = this.alertHistory();
      const _x = this.alertHistoryIsOpen();

      this.scrollToBottom();
    });
  }

  private scrollToBottom() {
    if (this.scroller() && this.scroller().nativeElement) {
      this.scroller().nativeElement.scrollTo(0, this.scroller().nativeElement.scrollHeight);
    }
  }

  @HostListener('mouseover')
  onMouseOver() {
    if (typeof this.inline === 'string') return;

    this.sparkleAlertService.setHidden(false);
  }

  @HostListener('mouseout')
  onMouseOut() {
    if (typeof this.inline === 'string') return;

    this.sparkleAlertService.setHidden(true);
  }

  getElementHeight(i: number) {
    if (!this.alerts) return 0;

    const elementHeights = this.alerts()
      .toArray()
      .map((element) => element._el.nativeElement.querySelector('.sparkle-alert-item').offsetHeight);

    if (!elementHeights) return 0;

    let totalHeight = 0;
    const elementTransformPos = elementHeights.map((height, i) => {
      totalHeight += height;
      return totalHeight - elementHeights[0];
    });
    // .reverse();

    // console.log('elementTransformPos: ', elementTransformPos);

    return elementTransformPos[i];
  }

  transformY(i: number) {
    return `translateY(calc(-${this.getElementHeight(i - 1)}px + (-10px * ${i})))`;
  }

  transitionDelay(i: number, allOpen = false) {
    return allOpen ? this.alertHistory().length - 1 * 40 + 'ms' : (this.numberOfOpenAlerts() - i) * 40 + 'ms';
  }
}
