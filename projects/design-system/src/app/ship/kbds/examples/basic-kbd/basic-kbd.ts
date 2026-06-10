import { Component } from '@angular/core';
import { ShipKbd } from '@ship-ui/core/ship-kbd';

@Component({
  selector: 'basic-kbd-example',
  standalone: true,
  imports: [ShipKbd],
  template: `
    <div style="display: flex; gap: 1rem; align-items: center;">
      <sh-kbd meta>K</sh-kbd>
      <sh-kbd shift alt>P</sh-kbd>
      <sh-kbd enter></sh-kbd>
    </div>
  `
})
export class BasicKbd {}
