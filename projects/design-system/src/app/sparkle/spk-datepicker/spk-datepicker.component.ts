import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-datepicker',
  standalone: true,
  imports: [],
  templateUrl: './spk-datepicker.component.html',
  styleUrl: './spk-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkDatepickerComponent {}
