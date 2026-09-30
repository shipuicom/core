import { ChangeDetectionStrategy, Component, effect, input, model } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { disabled, form, FormField } from '@angular/forms/signals';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

@Component({
  selector: 'app-toggle-sandbox',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FormField, ShipToggle],
  templateUrl: './toggle-sandbox.html',
  styleUrl: './toggle-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSandbox {
  checked = model(true);
  disabled = input(false);
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');

  formCtrl = new FormControl<boolean | null>(null);
  formFieldAsForm = form(this.checked, (schemaPath) => {
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
