import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[shPreventWheel]',
})
export class ShipPreventWheel {
  @HostListener('wheel', ['$event']) wheel(event: WheelEvent) {
    event.preventDefault();
  }
}
