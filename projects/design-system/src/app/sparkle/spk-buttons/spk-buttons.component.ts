import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleButtonComponent, SparkleDividerComponent, SparkleIconComponent } from 'spk/public';

@Component({
  selector: 'app-spk-buttons',
  imports: [SparkleDividerComponent, SparkleIconComponent, SparkleButtonComponent],
  templateUrl: './spk-buttons.component.html',
  styleUrl: './spk-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkButtonsComponent {}
