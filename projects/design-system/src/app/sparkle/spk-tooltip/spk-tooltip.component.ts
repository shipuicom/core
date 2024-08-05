import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-tooltip',
  standalone: true,
  imports: [],
  templateUrl: './spk-tooltip.component.html',
  styleUrl: './spk-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkTooltipComponent {}
