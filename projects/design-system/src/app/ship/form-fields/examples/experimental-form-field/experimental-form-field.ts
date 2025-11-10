import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipFormFieldExperimental } from 'ship-ui';

@Component({
  selector: 'app-experimental-form-field',
  imports: [ShipFormFieldExperimental, FormsModule, ReactiveFormsModule],
  templateUrl: './experimental-form-field.html',
  styleUrl: './experimental-form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ExperimentalFormField {
  reactiveFormControl = new FormControl('reactive hello');
  ngModelControl = signal('yellow');

  reactiveFormValue = toSignal(this.reactiveFormControl.valueChanges);

  ngOnInit() {
    setTimeout(() => {
      this.reactiveFormControl.setValue('123 reactive');
      this.ngModelControl.set('678 ngModel');
    }, 5000);
  }
}
