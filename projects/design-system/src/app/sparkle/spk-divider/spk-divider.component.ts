import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleDividerComponent } from 'spk/public';

@Component({
  selector: 'app-spk-divider',
  imports: [SparkleDividerComponent],
  templateUrl: './spk-divider.component.html',
  styleUrl: './spk-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkDividerComponent {}
