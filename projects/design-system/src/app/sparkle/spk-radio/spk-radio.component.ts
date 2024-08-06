import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SparkleRadioComponent } from '../../../../../sparkle-ui/src/public-api';

const fb = new FormBuilder();
@Component({
  selector: 'app-spk-radio',
  standalone: true,
  imports: [SparkleRadioComponent, ReactiveFormsModule],
  templateUrl: './spk-radio.component.html',
  styleUrl: './spk-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkRadioComponent {
  active = signal(false);

  formCtrl = fb.control<string>('');
}
