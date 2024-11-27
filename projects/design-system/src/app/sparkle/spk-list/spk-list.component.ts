import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SparkleCheckboxComponent, SparkleIconComponent, SparkleListComponent } from 'spk/public';

@Component({
  selector: 'app-spk-list',
  imports: [ReactiveFormsModule, SparkleListComponent, SparkleIconComponent, SparkleCheckboxComponent],
  templateUrl: './spk-list.component.html',
  styleUrl: './spk-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkListComponent {
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = new FormControl(false);
}
