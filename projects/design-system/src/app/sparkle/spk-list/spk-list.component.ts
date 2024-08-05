import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-list',
  standalone: true,
  imports: [],
  templateUrl: './spk-list.component.html',
  styleUrl: './spk-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkListComponent {}
