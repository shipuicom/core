import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipFormFieldVariant } from '@ship-ui/core';

@Component({
  selector: 'app-form-field-sandbox',
  standalone: true,
  imports: [FormsModule, ShipFormField],
  templateUrl: './form-field-sandbox.html',
  styleUrl: './form-field-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldSandbox {
  label = input('Label');
  showLabel = input(true);
  prefix = input('');
  showPrefix = input(false);
  suffix = input('');
  showSuffix = input(false);
  placeholder = input('Placeholder...');
  hint = input('');
  showHint = input(false);
  error = input('');
  showError = input(false);
  disabled = input(false);
  inputType = input<'text' | 'number' | 'textarea'>('text');
  variant = input<ShipFormFieldVariant>(''); // '', 'small', 'autosize', etc.
  value = signal<string>('');
}
