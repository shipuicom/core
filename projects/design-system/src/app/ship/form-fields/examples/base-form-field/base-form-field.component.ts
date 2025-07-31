import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShipFormFieldComponent, ShipIconComponent } from '@ship-ui/core';

@Component({
  selector: 'app-base-form-field',
  imports: [ShipFormFieldComponent, ShipIconComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './base-form-field.component.html',
  styleUrl: './base-form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseFormFieldComponent {
  baseCtrl = new FormControl('');
  disabledCtrl = new FormControl({ value: '', disabled: true });
  errorCtrl = new FormControl('', [Validators.required]);
  errorCtrl1 = new FormControl('', [Validators.required, Validators.minLength(10)]);

  ngOnInit() {
    this.errorCtrl.markAsTouched();
    this.errorCtrl.markAsDirty();
  }
}
