import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-chips-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipChip" />`,
  styleUrl: './chips-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChipsApi {}
