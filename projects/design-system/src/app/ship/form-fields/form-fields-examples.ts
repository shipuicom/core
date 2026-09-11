import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseFormField } from './examples/base-form-field/base-form-field';
import { FormFieldSandbox } from './examples/form-field-sandbox/form-field-sandbox';
import { SignalFormField } from './examples/signal-form-field/signal-form-field';
import { SmallFormField } from './examples/small-form-field/small-form-field';

@Component({
  selector: 'app-form-fields-examples',
  imports: [Previewer, FormFieldSandbox, BaseFormField, SmallFormField, SignalFormField],
  templateUrl: './form-fields-examples.html',
  styleUrl: './form-fields-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormFieldsExamples {}
