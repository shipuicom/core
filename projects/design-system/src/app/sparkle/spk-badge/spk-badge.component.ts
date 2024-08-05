import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-badge',
  standalone: true,
  imports: [],
  templateUrl: './spk-badge.component.html',
  styleUrl: './spk-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkBadgeComponent {}
