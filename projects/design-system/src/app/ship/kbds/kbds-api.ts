import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-kbds-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipKbd" />`,
  styleUrl: './kbds-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class KbdsApi {}
