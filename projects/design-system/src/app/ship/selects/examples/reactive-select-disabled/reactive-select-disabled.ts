import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ShipSelect } from 'ship-ui';

@Component({
  selector: 'app-reactive-select-disabled',
  standalone: true,
  imports: [ReactiveFormsModule, ShipSelect],
  templateUrl: './reactive-select-disabled.html',
  styleUrl: './reactive-select-disabled.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveSelectDisabled {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  control = new FormControl({
    value: 'pizza',
    disabled: true,
  });
}
