import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-toggle',
  imports: [],
  template: `
    <div class="box">
      <div class="knob"></div>
    </div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipToggle {}
