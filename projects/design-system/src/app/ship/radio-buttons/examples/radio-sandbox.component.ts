import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipButtonGroupComponent, ShipRadioComponent, ShipToggleComponent } from '@ship-ui/core';

@Component({
  selector: 'app-radio-sandbox',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, ShipRadioComponent, ShipButtonGroupComponent, ShipToggleComponent],
  templateUrl: './radio-sandbox.component.html',
  styleUrl: './radio-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioSandboxComponent {
  values = ['one', 'two', 'three'];
  isDisabled = signal<boolean>(false);
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  exampleClass = computed(() => this.colorClass() + ' ' + this.variationClass());

  selected = signal<string>('one');
  model = signal<string>('two');
  formCtrl = new FormControl<string>('three');

  disabledEffect = effect(() => {
    const isDisabled = this.isDisabled();

    if (isDisabled) {
      this.formCtrl.disable();
    } else {
      this.formCtrl.enable();
    }
  });
}
