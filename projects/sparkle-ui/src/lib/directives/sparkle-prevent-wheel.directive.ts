import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[spkPreventWheel]',
  standalone: true,
})
export class SparklePreventWheelDirective {
  @HostListener('wheel', ['$event']) wheel(event: WheelEvent) {
    event.preventDefault();
  }
}
