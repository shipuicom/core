import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SparkleIconComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, SparkleIconComponent, MatSelectModule],
  templateUrl: './form-fields.component.html',
  styleUrl: './form-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormFieldsComponent {
  disabledCtrl = new FormControl({ value: '', disabled: true });
  errorCtrl = new FormControl(null, [Validators.required]);

  ngOnInit() {
    this.errorCtrl.markAsTouched();
    this.errorCtrl.markAsDirty();
  }
}
