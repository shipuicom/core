import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicRadio } from './examples/basic-radio/basic-radio';

@Component({
  selector: 'app-radio-buttons-overview',
  imports: [Previewer, PropertyViewer, BasicRadio],
  templateUrl: './radio-buttons-overview.html',
  styleUrl: './radio-buttons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadioButtonsOverview {}
