import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-event-card',
  imports: [],
  template: `
    <div class="content">
      <ng-content />
    </div>

    <div class="actions">
      <ng-content select="[actions]" />
      <ng-content select="button" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet',
  },
})
export class ShipEventCard {}
