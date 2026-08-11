import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicFormField } from './examples/basic-form-field/basic-form-field';

@Component({
  selector: 'app-form-fields-overview',
  imports: [Previewer, PropertyViewer, BasicFormField],
  templateUrl: './form-fields-overview.html',
  styleUrl: './form-fields-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormFieldsOverview {}
