import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { SparkleButtonComponent, SparkleIconComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-buttons',
  standalone: true,
  imports: [MatDividerModule, SparkleIconComponent, SparkleButtonComponent],
  templateUrl: './spk-buttons.component.html',
  styleUrl: './spk-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkButtonsComponent {}
