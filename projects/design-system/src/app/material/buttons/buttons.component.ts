import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { SparkleIconComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-buttons',
  standalone: true,
  imports: [MatDividerModule, SparkleIconComponent, MatButtonModule],
  templateUrl: './buttons.component.html',
  styleUrl: './buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonsComponent {}
