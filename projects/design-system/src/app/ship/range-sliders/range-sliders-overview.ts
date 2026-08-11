import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseRangeSlider } from './examples/base-range-slider/base-range-slider';

@Component({
  selector: 'app-range-sliders-overview',
  imports: [Previewer, PropertyViewer, BaseRangeSlider],
  templateUrl: './range-sliders-overview.html',
  styleUrl: './range-sliders-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RangeSlidersOverview {}
