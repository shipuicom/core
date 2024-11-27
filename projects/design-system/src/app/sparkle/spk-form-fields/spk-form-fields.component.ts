import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SparkleFormFieldComponent, SparkleIconComponent } from 'spk/public';

@Component({
  selector: 'app-spk-form-fields',
  imports: [SparkleIconComponent, SparkleFormFieldComponent, ReactiveFormsModule],
  templateUrl: './spk-form-fields.component.html',
  styleUrl: './spk-form-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkFormFieldsComponent {
  baseCtrl = new FormControl('');
  disabledCtrl = new FormControl({ value: '', disabled: true });
  errorCtrl = new FormControl('', [Validators.required]);

  ngOnInit() {
    this.errorCtrl.markAsTouched();
    this.errorCtrl.markAsDirty();
  }
}
