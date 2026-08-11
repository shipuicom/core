import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicCheckbox } from './examples/basic-checkbox/basic-checkbox';

@Component({
  selector: 'app-checkboxes-overview',
  imports: [Previewer, PropertyViewer, BasicCheckbox],
  templateUrl: './checkboxes-overview.html',
  styleUrl: './checkboxes-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CheckboxesOverview {}
