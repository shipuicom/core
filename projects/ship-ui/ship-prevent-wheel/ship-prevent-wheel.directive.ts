import { Directive } from '@angular/core';

@Directive({
  selector: '[shPreventWheel]',
  host: {
    '(wheel)': 'wheel($event)',
  },
})
export class ShipPreventWheel {
  wheel(event: WheelEvent) {
    event.preventDefault();
  }
}
