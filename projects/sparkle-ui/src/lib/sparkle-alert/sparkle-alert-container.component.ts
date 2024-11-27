import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  computed,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';
import { SparkleAlertComponent } from './sparkle-alert.component';
import { SparkleAlertService } from './sparkle-alert.service';

@Component({
    selector: 'sparkle-alert-container',
    imports: [SparkleAlertComponent, SparkleIconComponent],
    templateUrl: './sparkle-alert-container.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SparkleAlertContainerComponent {
  inline = input<string | null>(null);
  alerts = viewChild.required<QueryList<SparkleAlertComponent>>('alerts');
  scroller = viewChild.required<ElementRef<HTMLDivElement>>('scroller');
  alertService = input.required<SparkleAlertService>();

  alertHistory = this.alertService()?.alertHistory;
  alertHistoryIsOpen = this.alertService()?.alertHistoryIsOpen;
  alertHistoryIsHidden = this.alertService()?.alertHistoryIsHidden;

  numberOfOpenAlerts = computed(() => {
    return this.alertHistory().filter((x) => x.isOpen).length;
  });

  readonly #e = effect(() => {
    this.alertHistory();
    this.alertHistoryIsOpen();
    this.#scrollToBottom();
  });

  #scrollToBottom() {
    if (this.scroller() && this.scroller().nativeElement) {
      this.scroller().nativeElement.scrollTo(0, this.scroller().nativeElement.scrollHeight);
    }
  }

  @HostListener('mouseover')
  onMouseOver() {
    if (typeof this.inline === 'string') return;

    this.alertService().setHidden(false);
  }

  @HostListener('mouseout')
  onMouseOut() {
    if (typeof this.inline === 'string') return;

    this.alertService().setHidden(true);
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

    return elementTransformPos[i];
  }

  transformY(i: number) {
    return `translateY(calc(-${this.getElementHeight(i - 1)}px + (-10px * ${i})))`;
  }

  transitionDelay(i: number, allOpen = false) {
    return allOpen ? this.alertHistory().length - 1 * 40 + 'ms' : (this.numberOfOpenAlerts() - i) * 40 + 'ms';
  }
}
