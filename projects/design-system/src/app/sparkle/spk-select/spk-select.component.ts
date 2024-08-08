import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SparkleIconComponent, SparkleSelectComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-select',
  standalone: true,
  imports: [ReactiveFormsModule, SparkleSelectComponent, SparkleIconComponent],
  templateUrl: './spk-select.component.html',
  styleUrl: './spk-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSelectComponent {
  inputCtrl = new FormControl('');

  foods = [
    { value: 'steak-0', label: 'Steak' },
    { value: 'pizza-1', label: 'Pizza' },
    { value: 'tacos-2', label: 'Tacos' },
  ];
}
