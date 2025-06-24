import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  SparkleButtonGroupComponent,
  SparkleCheckboxComponent,
  SparkleToggleComponent,
} from '../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-checkbox-sandbox',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    SparkleCheckboxComponent,
    SparkleButtonGroupComponent,
    SparkleToggleComponent,
  ],
  templateUrl: './checkbox-sandbox.component.html',
  styleUrl: './checkbox-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxSandboxComponent {
  isChecked = signal<boolean>(false);
  isIndeterminate = signal<boolean>(false);
  isDisabled = signal<boolean>(false);
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('');
  exampleClass = computed(() => this.colorClass() + ' ' + this.variationClass());

  formCtrl = new FormControl<boolean | null>(null);

  disabledEffect = effect(() => {
    const isDisabled = this.isDisabled();

    if (isDisabled) {
      this.formCtrl.disable();
    } else {
      this.formCtrl.enable();
    }
  });
}
