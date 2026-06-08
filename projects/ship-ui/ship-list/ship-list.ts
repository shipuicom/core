import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'sh-list',
  styleUrl: './ship-list.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipList {}
