import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { disabled, form, FormField } from '@angular/forms/signals';
import { ShipButtonGroup, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-toggle-sandbox',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FormField, ShipToggle, ShipButtonGroup],
  templateUrl: './toggle-sandbox.html',
  styleUrl: './toggle-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSandbox {
  isChecked = signal<boolean>(true);
  isDisabled = signal<boolean>(false);
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');

  formCtrl = new FormControl<boolean | null>(null);
  formFieldAsForm = form(this.isChecked, (schemaPath) => {
    disabled(schemaPath, () => this.isDisabled());
  });

  disabledEffect = effect(() => {
    const isDisabled = this.isDisabled();
    if (isDisabled) {
      this.formCtrl.disable();
    } else {
      this.formCtrl.enable();
    }
  });
}
