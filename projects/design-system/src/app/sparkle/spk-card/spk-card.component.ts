import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-card',
  standalone: true,
  imports: [],
  templateUrl: './spk-card.component.html',
  styleUrl: './spk-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkCardComponent {}
