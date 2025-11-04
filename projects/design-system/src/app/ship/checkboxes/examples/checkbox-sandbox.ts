import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipButtonGroup, ShipCheckbox, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-checkbox-sandbox',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, ShipCheckbox, ShipButtonGroup, ShipToggle],
  templateUrl: './checkbox-sandbox.html',
  styleUrl: './checkbox-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxSandbox {
  isIndeterminate = signal<boolean>(false);
  isDisabled = signal<boolean>(false);
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  exampleClass = computed(() => this.colorClass() + ' ' + this.variationClass());

  isChecked = signal<boolean>(true);
  formCtrl = new FormControl<boolean | null>(true);

  disabledEffect = effect(() => {
    const isDisabled = this.isDisabled();

    if (isDisabled) {
      this.formCtrl.disable();
    } else {
      this.formCtrl.enable();
    }
  });
}
