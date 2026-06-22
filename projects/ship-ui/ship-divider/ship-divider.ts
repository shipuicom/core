import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'sh-divider',
  styleUrl: './ship-divider.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'separator',
  },
})
export class ShipDivider {}
