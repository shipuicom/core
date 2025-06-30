import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  SparkleCheckboxComponent,
  SparkleIconComponent,
  SparkleListComponent,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'base-list-example',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, SparkleListComponent, SparkleIconComponent, SparkleCheckboxComponent],
  templateUrl: './base-list-example.component.html',
  styleUrls: ['./base-list-example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseListExampleComponent {
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = signal(false);
}
