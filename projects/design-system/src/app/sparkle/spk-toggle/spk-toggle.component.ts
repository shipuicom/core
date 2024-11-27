import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SparkleToggleComponent } from 'spk/public';

const fb = new FormBuilder();

@Component({
  selector: 'app-spk-toggle',
  imports: [SparkleToggleComponent, ReactiveFormsModule],
  templateUrl: './spk-toggle.component.html',
  styleUrl: './spk-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkToggleComponent {
  active = signal(false);

  formCtrl = fb.control(true);
}
