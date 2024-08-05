import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-table',
  standalone: true,
  imports: [],
  templateUrl: './spk-table.component.html',
  styleUrl: './spk-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkTableComponent {}
