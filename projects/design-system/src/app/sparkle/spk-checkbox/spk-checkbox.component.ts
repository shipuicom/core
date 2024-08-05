import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SparkleCheckboxComponent } from '../../../../../sparkle-ui/src/public-api';

const fb = new FormBuilder();
@Component({
  selector: 'app-spk-checkbox',
  standalone: true,
  imports: [SparkleCheckboxComponent, ReactiveFormsModule],
  templateUrl: './spk-checkbox.component.html',
  styleUrl: './spk-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkCheckboxComponent {
  active = signal(false);

  formCtrl = fb.control(true);
}
