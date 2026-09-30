import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { disabled, form, FormField } from '@angular/forms/signals';
import { ShipRadio } from '@ship-ui/core/ship-radio';

@Component({
  selector: 'app-radio-sandbox',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FormField, ShipRadio],
  templateUrl: './radio-sandbox.html',
  styleUrl: './radio-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioSandbox {
  values = ['one', 'two', 'three'];
  disabled = input(false);
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');

  selected = signal<string>('one');
  model = signal<string>('two');
  formCtrl = new FormControl<string>('three');
  formFieldAsForm = form(this.model, (schemaPath) => {
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
