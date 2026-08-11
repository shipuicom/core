import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-virtual-scrolls-api',
  imports: [ApiReference],
  template: `
    <app-api-reference name="ShipVirtualScroll" />
    <app-api-reference name="ShipVirtualScrollDirective" />
  `,
  styleUrl: './virtual-scrolls-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VirtualScrollsApi {}
