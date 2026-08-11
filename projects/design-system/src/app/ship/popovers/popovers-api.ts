import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-popovers-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipPopover" />`,
  styleUrl: './popovers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PopoversApi {}
