import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ShipSelect } from 'ship-ui';

@Component({
  selector: 'app-reactive-select',
  standalone: true,
  imports: [ReactiveFormsModule, ShipSelect],
  templateUrl: './reactive-select-example.html',
  styleUrl: './reactive-select-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveSelectComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  control = new FormControl('pizza');
}
