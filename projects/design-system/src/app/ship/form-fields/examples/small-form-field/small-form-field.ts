import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-small-form-field',
  imports: [ShipFormField, ShipIcon, FormsModule, ReactiveFormsModule],
  templateUrl: './small-form-field.html',
  styleUrl: './small-form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmallFormField {
  baseCtrl = new FormControl('');
  disabledCtrl = new FormControl({ value: '', disabled: true });
  errorCtrl = new FormControl('', [Validators.required]);
  errorCtrl1 = new FormControl('', [Validators.required, Validators.minLength(10)]);

  ngOnInit() {
    this.errorCtrl.markAsTouched();
    this.errorCtrl.markAsDirty();
  }
}
