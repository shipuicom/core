import { ChangeDetectionStrategy, Component, effect, input, model, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { disabled, form, FormField } from '@angular/forms/signals';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';

@Component({
  selector: 'app-checkbox-sandbox',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FormField, ShipCheckbox],
  templateUrl: './checkbox-sandbox.html',
  styleUrl: './checkbox-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxSandbox {
  checked = model<boolean>(true);
  indeterminate = input(false);
  disabled = input(false);
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');

  formCtrl = new FormControl<boolean | null>(true);
  formFieldSignal = signal(true);
  formFieldAsForm = form(this.formFieldSignal, (schemaPath) => {
    disabled(schemaPath, () => this.disabled());
  });

  disabledEffect = effect(() => {
    const isDisabled = this.disabled();

    if (isDisabled) {
      this.formCtrl.disable();
    } else {
      this.formCtrl.enable();
    }
  });
}
