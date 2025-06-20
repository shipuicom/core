import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleButtonComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-button',
  imports: [SparkleIconComponent, SparkleButtonComponent],
  templateUrl: './base-button.component.html',
  styleUrl: './base-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseButtonComponent {}
