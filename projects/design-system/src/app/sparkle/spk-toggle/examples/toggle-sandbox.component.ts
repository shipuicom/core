import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SparkleButtonGroupComponent, SparkleToggleComponent } from '../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-toggle-sandbox',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, SparkleToggleComponent, SparkleButtonGroupComponent],
  templateUrl: './toggle-sandbox.component.html',
  styleUrl: './toggle-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSandboxComponent {
  isChecked = signal<boolean>(false);
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
