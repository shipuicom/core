import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseFormFieldComponent } from './examples/base-form-field/base-form-field.component';
import { FormFieldSandboxComponent } from './examples/form-field-sandbox/form-field-sandbox.component';
import { SmallFormFieldComponent } from './examples/small-form-field/small-form-field.component';

@Component({
  selector: 'app-spk-form-fields',
  imports: [
    ReactiveFormsModule,
    FormFieldSandboxComponent,
    PropertyViewerComponent,
    PreviewerComponent,

    BaseFormFieldComponent,
    SmallFormFieldComponent,
  ],
  templateUrl: './spk-form-fields.component.html',
  styleUrl: './spk-form-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkFormFieldsComponent {}
