import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroupComponent, ShipCheckboxComponent, ShipFormField } from 'ship-ui';

@Component({
  selector: 'app-form-field-sandbox',
  standalone: true,
  imports: [FormsModule, ShipFormField, ShipButtonGroupComponent, ShipCheckboxComponent],
  templateUrl: './form-field-sandbox.component.html',
  styleUrl: './form-field-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldSandboxComponent {
  label = signal<string>('Label');
  showLabel = signal<boolean>(true);
  prefix = signal<string>('');
  showPrefix = signal<boolean>(false);
  suffix = signal<string>('');
  showSuffix = signal<boolean>(false);
  placeholder = signal<string>('Placeholder...');
  hint = signal<string>('');
  showHint = signal<boolean>(false);
  error = signal<string>('');
  showError = signal<boolean>(false);
  disabled = signal<boolean>(false);
  inputType = signal<'text' | 'number' | 'textarea'>('text');
  size = signal<string>(''); // '', 'small', 'autosize', etc.
  value = signal<string>('');
}
