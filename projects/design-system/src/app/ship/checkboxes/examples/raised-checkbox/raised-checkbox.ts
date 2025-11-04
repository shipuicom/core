import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipCheckbox } from 'ship-ui';

@Component({
  selector: 'app-raised-checkbox',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ShipCheckbox],
  templateUrl: './raised-checkbox.html',
  styleUrl: './raised-checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedCheckbox {
  active = signal(false);
  formCtrl = new FormControl(false);
}
