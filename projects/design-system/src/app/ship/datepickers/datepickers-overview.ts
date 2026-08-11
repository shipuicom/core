import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseDatepicker } from './examples/base-datepicker/base-datepicker';

@Component({
  selector: 'app-datepickers-overview',
  imports: [Previewer, PropertyViewer, BaseDatepicker],
  templateUrl: './datepickers-overview.html',
  styleUrl: './datepickers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatepickersOverview {}
