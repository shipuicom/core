import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleDividerComponent } from '@sparkle-ui/core';

@Component({
  selector: 'app-spk-divider',
  standalone: true,
  imports: [SparkleDividerComponent],
  templateUrl: './spk-divider.component.html',
  styleUrl: './spk-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkDividerComponent {}
