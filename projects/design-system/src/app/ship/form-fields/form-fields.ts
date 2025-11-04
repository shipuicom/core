import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseFormField } from './examples/base-form-field/base-form-field';
import { FormFieldSandbox } from './examples/form-field-sandbox/form-field-sandbox';
import { SmallFormField } from './examples/small-form-field/small-form-field';

@Component({
  selector: 'app-form-fields',
  imports: [ReactiveFormsModule, FormFieldSandbox, PropertyViewer, Previewer, BaseFormField, SmallFormField],
  templateUrl: './form-fields.html',
  styleUrl: './form-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormFields {}
