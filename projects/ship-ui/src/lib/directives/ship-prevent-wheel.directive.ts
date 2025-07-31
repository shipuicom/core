import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[shPreventWheel]',
  standalone: true,
})
export class ShipPreventWheelDirective {
  @HostListener('wheel', ['$event']) wheel(event: WheelEvent) {
    event.preventDefault();
  }
}
