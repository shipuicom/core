import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-range-sliders-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipRangeSlider" />`,
  styleUrl: './range-sliders-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RangeSlidersApi {}
