import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipFormFieldVariant } from '@ship-ui/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { Previewer } from '../../previewer/previewer';
import { BaseFormField } from './examples/base-form-field/base-form-field';
import { FormFieldSandbox } from './examples/form-field-sandbox/form-field-sandbox';
import { SignalFormField } from './examples/signal-form-field/signal-form-field';
import { SmallFormField } from './examples/small-form-field/small-form-field';

@Component({
  selector: 'app-form-fields-examples',
  imports: [
    FormsModule,
    Previewer,
    ShipButtonGroup,
    ShipCheckbox,
    ShipFormField,
    FormFieldSandbox,
    BaseFormField,
    SmallFormField,
    SignalFormField,
  ],
  templateUrl: './form-fields-examples.html',
  styleUrl: './form-fields-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormFieldsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  label = signal('Label');
  showLabel = signal(true);
  prefix = signal('');
  showPrefix = signal(false);
  suffix = signal('');
  showSuffix = signal(false);
  placeholder = signal('Placeholder...');
  hint = signal('');
  showHint = signal(false);
  error = signal('');
  showError = signal(false);
  disabled = signal(false);
  inputType = signal<'text' | 'number' | 'textarea'>('text');
  variant = signal<ShipFormFieldVariant>('');
}
