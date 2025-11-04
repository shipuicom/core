import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShipFormField, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-small-form-field',
  imports: [ShipFormField, ShipIcon, FormsModule, ReactiveFormsModule],
  templateUrl: './small-form-field.component.html',
  styleUrl: './small-form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmallFormFieldComponent {
  baseCtrl = new FormControl('');
  disabledCtrl = new FormControl({ value: '', disabled: true });
  errorCtrl = new FormControl('', [Validators.required]);
  errorCtrl1 = new FormControl('', [Validators.required, Validators.minLength(10)]);

  ngOnInit() {
    this.errorCtrl.markAsTouched();
    this.errorCtrl.markAsDirty();
  }
}
