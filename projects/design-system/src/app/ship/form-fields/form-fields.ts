import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseFormField } from './examples/base-form-field/base-form-field';
import { BasicFormField } from './examples/basic-form-field/basic-form-field';
import { FormFieldSandbox } from './examples/form-field-sandbox/form-field-sandbox';
import { SmallFormField } from './examples/small-form-field/small-form-field';

@Component({
  selector: 'app-form-fields',
  imports: [
    ShipTabs,
    ApiReference,
    ReactiveFormsModule,
    FormFieldSandbox,
    PropertyViewer,
    Previewer,
    BasicFormField,
    BaseFormField,
    SmallFormField,
  ],
  templateUrl: './form-fields.html',
  styleUrl: './form-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormFields {
  activeTab = signal('overview');
}
