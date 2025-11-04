import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipButtonGroup, ShipRadio, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-radio-sandbox',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, ShipRadio, ShipButtonGroup, ShipToggle],
  templateUrl: './radio-sandbox.html',
  styleUrl: './radio-sandbox.scss',
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
