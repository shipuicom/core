import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-raised-checkbox',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ShipCheckbox],
  templateUrl: './raised-checkbox.component.html',
  styleUrl: './raised-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedCheckboxComponent {
  active = signal(false);
  formCtrl = new FormControl(false);
}
